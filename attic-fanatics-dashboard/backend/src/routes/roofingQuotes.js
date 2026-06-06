const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

const PITCH_MULTIPLIERS = {
  'flat': 1.000, '1/12': 1.003, '2/12': 1.014, '3/12': 1.031,
  '4/12': 1.054, '5/12': 1.083, '6/12': 1.118, '7/12': 1.158,
  '8/12': 1.202, '9/12': 1.250, '10/12': 1.302, '12/12': 1.414,
};

// Escalation thresholds — can be extended to DB config later
const ESCALATION_THRESHOLDS = {
  maxSquares: 45,
  maxPitchOver: 9,
  maxQuoteValue: 35000,
  maxExistingLayers: 2,
  minAIConfidence: 70,
};

function getPitchNum(pitch) {
  if (pitch === 'flat') return 0;
  const n = parseInt(pitch, 10);
  return isNaN(n) ? 0 : n;
}

function getPitchMultiplier(pitch) {
  return PITCH_MULTIPLIERS[pitch] ?? 1.0;
}

function calcQuoteTotals(facets, wastePercent, materialCostPerSq, laborCostPerSq, addOns = []) {
  let rawSquares = 0;
  for (const f of facets) {
    const mult = getPitchMultiplier(f.pitch);
    rawSquares += (parseFloat(f.widthFt) || 0) * (parseFloat(f.lengthFt) || 0) * mult / 100;
  }
  const adjustedSquares = rawSquares * (1 + (wastePercent || 10) / 100);

  const lineItems = [
    { description: `Roofing Material — ${addOns.materialLabel || 'Selected Material'}`, quantity: adjustedSquares, unit: 'squares', unitPrice: materialCostPerSq, total: adjustedSquares * materialCostPerSq },
    { description: 'Installation Labor', quantity: adjustedSquares, unit: 'squares', unitPrice: laborCostPerSq, total: adjustedSquares * laborCostPerSq },
  ];

  for (const addon of addOns) {
    if (addon.enabled) lineItems.push({ description: addon.label, quantity: addon.quantity ?? adjustedSquares, unit: addon.unit ?? 'squares', unitPrice: addon.unitPrice, total: (addon.quantity ?? adjustedSquares) * addon.unitPrice });
  }

  const subtotal = lineItems.reduce((s, l) => s + l.total, 0);
  return { rawSquares, adjustedSquares, lineItems, subtotal, total: subtotal };
}

function checkRuleEscalation(data) {
  const reasons = [];
  const { adjustedSquares, total, existingLayers, facets } = data;
  const maxPitch = Math.max(...(facets || []).map(f => getPitchNum(f.pitch)), 0);

  if (adjustedSquares > ESCALATION_THRESHOLDS.maxSquares)
    reasons.push(`Large roof: ${adjustedSquares.toFixed(1)} squares exceeds ${ESCALATION_THRESHOLDS.maxSquares}-square residential threshold — field measurement verification required`);
  if (maxPitch > ESCALATION_THRESHOLDS.maxPitchOver)
    reasons.push(`Steep pitch: ${maxPitch}/12 requires safety assessment and specialized crew — site visit required before proceeding`);
  if (total > ESCALATION_THRESHOLDS.maxQuoteValue)
    reasons.push(`High-value quote: $${total.toLocaleString()} exceeds $${ESCALATION_THRESHOLDS.maxQuoteValue.toLocaleString()} — manager approval required`);
  if (existingLayers >= ESCALATION_THRESHOLDS.maxExistingLayers)
    reasons.push(`Double tear-off: ${existingLayers} existing layers require additional on-site assessment of decking condition`);

  return reasons;
}

async function analyzeWithAI(quoteData) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const facetLines = (quoteData.facets || []).map((f, i) => {
      const mult = getPitchMultiplier(f.pitch);
      const sq = ((parseFloat(f.widthFt) || 0) * (parseFloat(f.lengthFt) || 0) * mult / 100).toFixed(2);
      return `  ${i + 1}. ${f.label || `Facet ${i+1}`}: ${f.widthFt}ft × ${f.lengthFt}ft @ ${f.pitch} pitch = ${sq} squares`;
    }).join('\n');

    const prompt = `Review this roofing quote for Forge Roofing:

PROPERTY: ${quoteData.propertyAddress || 'Not specified'}
ROOF TYPE: ${quoteData.roofType} | EXISTING LAYERS: ${quoteData.existingLayers}

ROOF FACETS:
${facetLines || '  (no facets entered)'}

TOTALS:
- Raw Squares: ${quoteData.totalSquares?.toFixed(2)}
- Waste Factor: ${quoteData.wastePercent}%
- Adjusted Squares: ${quoteData.adjustedSquares?.toFixed(2)}

MATERIAL: ${quoteData.materialType} @ $${quoteData.materialCostPerSq}/sq material + $${quoteData.laborCostPerSq}/sq labor
ESTIMATED TOTAL: $${quoteData.total?.toLocaleString()}

AUTO-ESCALATION THRESHOLDS:
- Adjusted squares > ${ESCALATION_THRESHOLDS.maxSquares}
- Steepest pitch > ${ESCALATION_THRESHOLDS.maxPitchOver}/12
- Quote total > $${ESCALATION_THRESHOLDS.maxQuoteValue.toLocaleString()}
- Existing layers >= ${ESCALATION_THRESHOLDS.maxExistingLayers}

Flag any measurement inconsistencies you detect (area disproportionate to typical properties, pitch conflicts with roof type, unusual facet ratios, waste % inappropriate for complexity, etc.).

Respond ONLY with valid JSON:
{
  "analysis": "professional assessment (2-3 sentences)",
  "measurementFlags": ["flag description if any"],
  "escalate": true,
  "escalationReasons": ["AI-detected reason if any"],
  "recommendedWastePct": 10,
  "confidenceScore": 85,
  "suggestions": ["improvement suggestion if any"]
}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 800,
      system: 'You are an expert roofing estimator AI for Forge Roofing, serving NJ, NY, and PA. Review measurement data and flag inconsistencies. Always respond with ONLY valid JSON, no markdown, no explanation outside the JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    // Extract JSON even if there's surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (err) {
    console.error('AI analysis error:', err.message);
    return null;
  }
}

let quoteCounter = 1000;
async function nextQuoteNumber() {
  const last = await prisma.roofingQuote.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } });
  if (last) {
    const n = parseInt(last.number.replace('RQ-', ''), 10);
    if (!isNaN(n)) return `RQ-${n + 1}`;
  }
  return `RQ-${quoteCounter++}`;
}

// POST /analyze — run AI + rule checks, no DB write
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const quoteData = req.body;
    const ruleReasons = checkRuleEscalation(quoteData);
    const ai = await analyzeWithAI(quoteData);

    const allEscalationReasons = [...ruleReasons];
    let aiFlags = [];
    let aiAnalysis = null;
    let aiConfidence = null;

    if (ai) {
      aiAnalysis = ai.analysis;
      aiFlags = ai.measurementFlags || [];
      aiConfidence = ai.confidenceScore;
      if (ai.escalate && ai.escalationReasons?.length) {
        for (const r of ai.escalationReasons) {
          if (!allEscalationReasons.includes(r)) allEscalationReasons.push(r);
        }
      }
      if (ai.confidenceScore < ESCALATION_THRESHOLDS.minAIConfidence) {
        const flag = `Low measurement confidence: AI confidence score ${ai.confidenceScore}% — measurements should be verified on site`;
        if (!allEscalationReasons.includes(flag)) allEscalationReasons.push(flag);
      }
    }

    res.json({
      escalated: allEscalationReasons.length > 0,
      escalationReasons: allEscalationReasons,
      aiAnalysis,
      aiFlags,
      aiConfidence,
      recommendedWastePct: ai?.recommendedWastePct ?? null,
      suggestions: ai?.suggestions ?? [],
      thresholds: ESCALATION_THRESHOLDS,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const [total, byStatus, totalValue] = await Promise.all([
      prisma.roofingQuote.count(),
      prisma.roofingQuote.groupBy({ by: ['status'], _count: true }),
      prisma.roofingQuote.aggregate({ _sum: { total: true } }),
    ]);
    res.json({ total, byStatus, totalValue: totalValue._sum.total || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, escalated, leadId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (escalated === 'true') where.escalated = true;
    if (leadId) where.leadId = leadId;

    const quotes = await prisma.roofingQuote.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(quotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const quote = await prisma.roofingQuote.findUnique({
      where: { id: req.params.id },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const number = await nextQuoteNumber();
    const data = { ...req.body, number, createdById: req.user.id };
    delete data.lead; delete data.createdBy; delete data.approvedBy;

    const quote = await prisma.roofingQuote.create({
      data,
      include: { createdBy: { select: { name: true } } },
    });
    res.status(201).json(quote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.number; delete data.createdById; delete data.createdAt;
    delete data.lead; delete data.createdBy; delete data.approvedBy;

    const quote = await prisma.roofingQuote.update({
      where: { id: req.params.id },
      data,
      include: { createdBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
    });
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/approve', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const quote = await prisma.roofingQuote.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        escalationNotes: req.body.escalationNotes ?? undefined,
      },
      include: { approvedBy: { select: { name: true } } },
    });
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    await prisma.roofingQuote.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

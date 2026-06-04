const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'ESTIMATE_SENT', 'NEGOTIATING', 'WON', 'LOST', 'UNQUALIFIED'];

router.get('/kanban', authenticate, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        leadSource: { select: { name: true, slug: true } },
        assignedRep: { select: { name: true } },
        estimates: { select: { total: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const kanban = {};
    STAGES.forEach(s => { kanban[s] = []; });
    leads.forEach(l => { if (kanban[l.stage]) kanban[l.stage].push(l); });

    res.json(kanban);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = await prisma.lead.count();
    const byStageCounts = await prisma.lead.groupBy({ by: ['stage'], _count: true });
    const wonLeads = await prisma.lead.findMany({ where: { stage: 'WON' }, select: { estimatedValue: true } });
    const pipelineLeads = await prisma.lead.findMany({
      where: { stage: { notIn: ['WON', 'LOST', 'UNQUALIFIED'] } },
      select: { estimatedValue: true },
    });

    const pipelineValue = pipelineLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
    const wonValue = wonLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
    const wonCount = byStageCounts.find(b => b.stage === 'WON')?._count || 0;
    const lostCount = byStageCounts.find(b => b.stage === 'LOST')?._count || 0;
    const closeRate = (wonCount + lostCount) > 0 ? wonCount / (wonCount + lostCount) : 0;

    res.json({ total, pipelineValue, wonValue, closeRate, byStage: byStageCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { stage, repId, search } = req.query;
    const where = {};
    if (stage) where.stage = stage;
    if (repId) where.assignedRepId = repId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        leadSource: { select: { name: true, slug: true } },
        assignedRep: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        leadSource: true,
        assignedRep: true,
        stageHistory: {
          include: { changedBy: { select: { name: true } } },
          orderBy: { changedAt: 'desc' },
        },
        activities: {
          include: { createdBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        estimates: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { name, phone, email, address, city, state, zip, leadSourceId, assignedRepId, estimatedValue, notes } = req.body;

    const lead = await prisma.lead.create({
      data: {
        name, phone, email, address, city, state, zip,
        leadSourceId,
        assignedRepId: assignedRepId || null,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        notes,
      },
      include: {
        leadSource: { select: { name: true, slug: true } },
        assignedRep: { select: { name: true } },
      },
    });

    await prisma.leadStageHistory.create({
      data: { leadId: lead.id, toStage: 'NEW', changedById: req.user.id },
    });

    res.status(201).json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { stage, stageNote, ...rest } = req.body;
    const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    const data = { ...rest };
    if (stage) data.stage = stage;
    if (rest.estimatedValue !== undefined) data.estimatedValue = rest.estimatedValue ? parseFloat(rest.estimatedValue) : null;

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data,
      include: {
        leadSource: { select: { name: true, slug: true } },
        assignedRep: { select: { name: true } },
      },
    });

    if (stage && stage !== existing.stage) {
      await prisma.leadStageHistory.create({
        data: {
          leadId: lead.id,
          fromStage: existing.stage,
          toStage: stage,
          changedById: req.user.id,
          note: stageNote || null,
        },
      });
    }

    res.json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/activities', authenticate, async (req, res) => {
  try {
    const { type, subject, body, scheduledAt } = req.body;
    const activity = await prisma.leadActivity.create({
      data: {
        leadId: req.params.id,
        type,
        subject,
        body,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdById: req.user.id,
      },
      include: { createdBy: { select: { name: true } } },
    });
    res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/bulk', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });

    await prisma.leadActivity.deleteMany({ where: { leadId: { in: ids } } });
    await prisma.leadStageHistory.deleteMany({ where: { leadId: { in: ids } } });
    await prisma.estimate.deleteMany({ where: { leadId: { in: ids } } });
    await prisma.lead.deleteMany({ where: { id: { in: ids } } });

    res.json({ deleted: ids.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    await prisma.leadActivity.deleteMany({ where: { leadId: req.params.id } });
    await prisma.leadStageHistory.deleteMany({ where: { leadId: req.params.id } });
    await prisma.estimate.deleteMany({ where: { leadId: req.params.id } });
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

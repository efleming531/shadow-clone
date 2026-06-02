const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

const STAGE_WEIGHTS = {
  NEW: 0.05,
  CONTACTED: 0.15,
  QUALIFIED: 0.30,
  ESTIMATE_SENT: 0.50,
  NEGOTIATING: 0.70,
  WON: 1.0,
  LOST: 0,
  UNQUALIFIED: 0,
};

router.get('/', authenticate, async (req, res) => {
  try {
    const [leads, deals] = await Promise.all([
      prisma.lead.findMany({
        where: { stage: { notIn: ['WON', 'LOST', 'UNQUALIFIED'] } },
        select: { stage: true, estimatedValue: true },
      }),
      prisma.deal.findMany({
        where: {
          date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        select: { revenue: true, date: true },
      }),
    ]);

    const pipelineValue = leads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
    const weightedValue = leads.reduce((s, l) => s + (l.estimatedValue || 0) * (STAGE_WEIGHTS[l.stage] || 0), 0);

    const now = new Date();
    const last30 = deals.filter(d => new Date(d.date) > new Date(now - 30 * 24 * 60 * 60 * 1000));
    const last60to30 = deals.filter(d => {
      const dt = new Date(d.date);
      return dt <= new Date(now - 30 * 24 * 60 * 60 * 1000) && dt > new Date(now - 60 * 24 * 60 * 60 * 1000);
    });

    const rev30 = last30.reduce((s, d) => s + d.revenue, 0);
    const rev60to30 = last60to30.reduce((s, d) => s + d.revenue, 0);
    const growthRate = rev60to30 > 0 ? (rev30 - rev60to30) / rev60to30 : 0;

    const projected30 = rev30 * (1 + growthRate);
    const projected90 = rev30 * 3 * (1 + growthRate);

    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthDeals = deals.filter(d => new Date(d.date) >= start && new Date(d.date) <= end);
      monthlyRevenue.push({
        month: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: monthDeals.reduce((s, d) => s + d.revenue, 0),
      });
    }

    res.json({
      pipelineValue,
      weightedValue,
      projected30,
      projected90,
      growthRate,
      monthlyRevenue,
      stageBreakdown: Object.entries(
        leads.reduce((acc, l) => {
          if (!acc[l.stage]) acc[l.stage] = { count: 0, value: 0 };
          acc[l.stage].count++;
          acc[l.stage].value += l.estimatedValue || 0;
          return acc;
        }, {})
      ).map(([stage, data]) => ({ stage, ...data, weight: STAGE_WEIGHTS[stage] || 0 })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

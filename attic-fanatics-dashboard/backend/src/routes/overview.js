const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { computeMetrics, getDateRange } = require('../utils/metrics');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const { start, end } = getDateRange(period);

    const funnelData = await prisma.funnelData.findMany({
      where: { date: { gte: start, lte: end } },
      include: { leadSource: true },
    });

    const overall = computeMetrics(funnelData);

    const bySource = {};
    for (const row of funnelData) {
      const slug = row.leadSource.slug;
      if (!bySource[slug]) bySource[slug] = { name: row.leadSource.name, slug, data: [] };
      bySource[slug].data.push(row);
    }

    const sourceMetrics = Object.entries(bySource).map(([slug, { name, data }]) => ({
      slug,
      name,
      ...computeMetrics(data),
    }));

    const deals = await prisma.deal.findMany({
      where: { date: { gte: start, lte: end } },
    });

    const installRate = deals.length > 0 ? deals.filter(d => d.installed).length / deals.length : 0;
    const referralRate = deals.length > 0 ? deals.filter(d => d.referralGenerated).length / deals.length : 0;
    const avgSalesCycle = deals.length > 0
      ? deals.reduce((sum, d) => sum + d.salesCycleDays, 0) / deals.length
      : 0;

    res.json({
      period,
      overall: { ...overall, installRate, referralRate, avgSalesCycle },
      sourceMetrics,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

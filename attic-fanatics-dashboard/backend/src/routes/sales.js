const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const getPeriodRange = (period) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);

  if (period === 'week') {
    start.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    start.setMonth(now.getMonth() - 1);
  } else {
    start.setFullYear(now.getFullYear(), 0, 1);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { start, end } = getPeriodRange(period);

    const reps = await prisma.salesRep.findMany({
      where: { isActive: true },
      include: {
        deals: {
          where: { date: { gte: start, lte: end } },
        },
      },
    });

    const leaderboard = reps
      .map(rep => ({
        id: rep.id,
        name: rep.name,
        totalSales: rep.deals.reduce((s, d) => s + d.revenue, 0),
        numDeals: rep.deals.length,
        closeRate: 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .map((rep, i) => ({ ...rep, rank: i + 1 }));

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/rep/:id', authenticate, async (req, res) => {
  try {
    const rep = await prisma.salesRep.findUnique({
      where: { id: req.params.id },
      include: {
        deals: {
          orderBy: { date: 'asc' },
          include: { leadSource: true },
        },
      },
    });
    if (!rep) return res.status(404).json({ error: 'Rep not found' });

    if (req.user.role === 'REP') {
      const userRep = await prisma.salesRep.findUnique({ where: { userId: req.user.id } });
      if (!userRep || userRep.id !== rep.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const deals = rep.deals;
    const totalRevenue = deals.reduce((s, d) => s + d.revenue, 0);
    const installed = deals.filter(d => d.installed).length;
    const referrals = deals.filter(d => d.referralGenerated).length;
    const avgOrderValue = deals.length > 0 ? totalRevenue / deals.length : 0;
    const avgSalesCycle = deals.length > 0
      ? deals.reduce((s, d) => s + d.salesCycleDays, 0) / deals.length
      : 0;

    const trendData = deals.reduce((acc, d) => {
      const month = d.date.toISOString().slice(0, 7);
      if (!acc[month]) acc[month] = { month, revenue: 0, deals: 0 };
      acc[month].revenue += d.revenue;
      acc[month].deals += 1;
      return acc;
    }, {});

    res.json({
      rep: { id: rep.id, name: rep.name },
      stats: {
        totalRevenue,
        numDeals: deals.length,
        installRate: deals.length > 0 ? installed / deals.length : 0,
        referralRate: deals.length > 0 ? referrals / deals.length : 0,
        avgOrderValue,
        avgSalesCycle,
      },
      trendData: Object.values(trendData),
      recentDeals: deals.slice(-10).reverse(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

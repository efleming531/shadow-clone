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

    const agents = await prisma.callCenterAgent.findMany({
      where: { isActive: true },
      include: {
        logs: { where: { date: { gte: start, lte: end } } },
      },
    });

    const leaderboard = agents.map(agent => {
      const logs = agent.logs;
      const answered = logs.filter(l => l.answered);
      const qualified = logs.filter(l => l.qualified);
      const booked = logs.filter(l => l.booked);
      const avgSpeed = logs.length > 0
        ? logs.reduce((s, l) => s + l.speedToLeadMinutes, 0) / logs.length
        : 0;

      return {
        id: agent.id,
        name: agent.name,
        totalLeads: logs.length,
        speedToLead: avgSpeed,
        answerRate: logs.length > 0 ? answered.length / logs.length : 0,
        qualifiedRate: logs.length > 0 ? qualified.length / logs.length : 0,
        bookedRate: logs.length > 0 ? booked.length / logs.length : 0,
      };
    }).sort((a, b) => b.bookedRate - a.bookedRate);

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/agent/:id', authenticate, async (req, res) => {
  try {
    const agent = await prisma.callCenterAgent.findUnique({
      where: { id: req.params.id },
      include: { logs: { orderBy: { date: 'asc' } } },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const logs = agent.logs;
    const answered = logs.filter(l => l.answered);
    const qualified = logs.filter(l => l.qualified);
    const booked = logs.filter(l => l.booked);
    const avgSpeed = logs.length > 0
      ? logs.reduce((s, l) => s + l.speedToLeadMinutes, 0) / logs.length
      : 0;

    const trendData = logs.reduce((acc, l) => {
      const week = l.date.toISOString().slice(0, 10);
      if (!acc[week]) acc[week] = { date: week, leads: 0, booked: 0 };
      acc[week].leads += 1;
      if (l.booked) acc[week].booked += 1;
      return acc;
    }, {});

    res.json({
      agent: { id: agent.id, name: agent.name },
      stats: {
        totalLeads: logs.length,
        speedToLead: avgSpeed,
        answerRate: logs.length > 0 ? answered.length / logs.length : 0,
        qualifiedRate: logs.length > 0 ? qualified.length / logs.length : 0,
        bookedRate: logs.length > 0 ? booked.length / logs.length : 0,
      },
      trendData: Object.values(trendData),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

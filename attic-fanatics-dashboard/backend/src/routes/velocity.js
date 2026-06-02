const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

const ACTIVE_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'ESTIMATE_SENT', 'NEGOTIATING'];

router.get('/', authenticate, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        stageHistory: { orderBy: { changedAt: 'asc' } },
      },
    });

    const stageDurations = {};
    ACTIVE_STAGES.forEach(s => { stageDurations[s] = []; });

    leads.forEach(lead => {
      const history = lead.stageHistory;
      for (let i = 0; i < history.length - 1; i++) {
        const from = history[i];
        const to = history[i + 1];
        const days = (new Date(to.changedAt) - new Date(from.changedAt)) / (1000 * 60 * 60 * 24);
        if (stageDurations[from.toStage]) stageDurations[from.toStage].push(days);
      }
    });

    const avgDaysPerStage = {};
    Object.keys(stageDurations).forEach(stage => {
      const arr = stageDurations[stage];
      avgDaysPerStage[stage] = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    });

    const byStageCounts = await prisma.lead.groupBy({ by: ['stage'], _count: true });
    const stageCountMap = {};
    byStageCounts.forEach(b => { stageCountMap[b.stage] = b._count; });

    const wonLeads = leads.filter(l => l.stage === 'WON');
    const avgCycleDays = wonLeads.length > 0
      ? wonLeads.reduce((sum, l) => {
          if (l.stageHistory.length >= 2) {
            const first = l.stageHistory[0];
            const last = l.stageHistory[l.stageHistory.length - 1];
            return sum + (new Date(last.changedAt) - new Date(first.changedAt)) / (1000 * 60 * 60 * 24);
          }
          return sum;
        }, 0) / wonLeads.length
      : 0;

    const total = leads.length;
    const won = leads.filter(l => l.stage === 'WON').length;
    const lost = leads.filter(l => l.stage === 'LOST').length;
    const overallConversion = (won + lost) > 0 ? won / (won + lost) : 0;

    res.json({
      avgDaysPerStage,
      stageCounts: stageCountMap,
      avgCycleDays,
      overallConversion,
      total,
      won,
      lost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

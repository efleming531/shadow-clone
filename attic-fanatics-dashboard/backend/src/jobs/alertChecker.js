const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAlerts() {
  try {
    const rules = await prisma.alertRule.findMany({ where: { isActive: true } });
    if (!rules.length) return;

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const rule of rules) {
      let value = null;

      if (rule.metric === 'cpl') {
        const data = await prisma.funnelData.aggregate({
          where: { date: { gte: dayStart } },
          _sum: { adSpend: true, leadsGenerated: true },
        });
        const spend = data._sum.adSpend || 0;
        const leads = data._sum.leadsGenerated || 0;
        value = leads > 0 ? spend / leads : 0;
      } else if (rule.metric === 'close_rate') {
        const data = await prisma.funnelData.aggregate({
          where: { date: { gte: dayStart } },
          _sum: { callsShowed: true, callsClosed: true },
        });
        const showed = data._sum.callsShowed || 0;
        const closed = data._sum.callsClosed || 0;
        value = showed > 0 ? closed / showed : 0;
      } else if (rule.metric === 'revenue') {
        const data = await prisma.funnelData.aggregate({
          where: { date: { gte: dayStart } },
          _sum: { revenue: true },
        });
        value = data._sum.revenue || 0;
      } else if (rule.metric === 'leads') {
        const data = await prisma.funnelData.aggregate({
          where: { date: { gte: dayStart } },
          _sum: { leadsGenerated: true },
        });
        value = data._sum.leadsGenerated || 0;
      }

      if (value === null) continue;

      let triggered = false;
      if (rule.condition === 'below' && value < rule.threshold) triggered = true;
      if (rule.condition === 'above' && value > rule.threshold) triggered = true;

      if (triggered) {
        console.log(`[ALERT] ${rule.name}: ${rule.metric} is ${value} (${rule.condition} ${rule.threshold})`);
        await prisma.alertRule.update({
          where: { id: rule.id },
          data: { lastFired: now },
        });
      }
    }
  } catch (err) {
    console.error('[AlertChecker] Error:', err.message);
  }
}

function startAlertChecker() {
  cron.schedule('0 * * * *', checkAlerts);
  console.log('Alert checker scheduled (hourly)');
}

module.exports = { startAlertChecker };

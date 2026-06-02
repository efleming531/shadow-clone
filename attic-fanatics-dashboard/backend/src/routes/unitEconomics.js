const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const [deals, funnelData, memberships, customers, jobs] = await Promise.all([
      prisma.deal.findMany({ select: { revenue: true, cashCollected: true, salesCycleDays: true } }),
      prisma.funnelData.findMany({ select: { adSpend: true, leadsGenerated: true, callsClosed: true, revenue: true } }),
      prisma.membership.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: { select: { price: true, billingCycle: true } } },
      }),
      prisma.customer.count(),
      prisma.job.findMany({ select: { totalRevenue: true, cashCollected: true } }),
    ]);

    const totalAdSpend = funnelData.reduce((s, f) => s + f.adSpend, 0);
    const totalLeads = funnelData.reduce((s, f) => s + f.leadsGenerated, 0);
    const totalRevenue = deals.reduce((s, d) => s + d.revenue, 0);
    const totalDeals = deals.length;
    const totalJobRevenue = jobs.reduce((s, j) => s + j.totalRevenue, 0);

    const cac = customers > 0 && totalAdSpend > 0 ? totalAdSpend / customers : 0;
    const aov = totalDeals > 0 ? totalRevenue / totalDeals : 0;
    const cpl = totalLeads > 0 ? totalAdSpend / totalLeads : 0;

    const mrr = memberships.reduce((sum, m) => {
      const p = m.plan.price;
      if (m.plan.billingCycle === 'MONTHLY') return sum + p;
      if (m.plan.billingCycle === 'QUARTERLY') return sum + p / 3;
      if (m.plan.billingCycle === 'ANNUAL') return sum + p / 12;
      return sum;
    }, 0);

    const avgSalesCycle = deals.length > 0
      ? deals.reduce((s, d) => s + d.salesCycleDays, 0) / deals.length
      : 0;

    const grossMarginEst = 0.65;
    const ltv = aov * grossMarginEst * 2.5;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const paybackMonths = mrr > 0 && cac > 0 ? cac / mrr : 0;

    const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    res.json({
      cac,
      ltv,
      ltvCacRatio,
      aov,
      cpl,
      mrr,
      arr: mrr * 12,
      roas,
      avgSalesCycle,
      paybackMonths,
      totalRevenue: totalRevenue + totalJobRevenue,
      totalAdSpend,
      totalDeals,
      totalCustomers: customers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

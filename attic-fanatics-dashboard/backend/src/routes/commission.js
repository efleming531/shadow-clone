const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/rules', authenticate, async (req, res) => {
  try {
    const rules = await prisma.commissionRule.findMany({
      include: { _count: { select: { payouts: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/rules', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { name, roleTarget, type, rate, bonusThreshold, bonusRate } = req.body;
    const rule = await prisma.commissionRule.create({
      data: {
        name,
        roleTarget,
        type,
        rate: parseFloat(rate),
        bonusThreshold: bonusThreshold ? parseFloat(bonusThreshold) : null,
        bonusRate: bonusRate ? parseFloat(bonusRate) : null,
      },
    });
    res.status(201).json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/rules/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { rate, bonusThreshold, bonusRate, ...rest } = req.body;
    const data = { ...rest };
    if (rate !== undefined) data.rate = parseFloat(rate);
    if (bonusThreshold !== undefined) data.bonusThreshold = bonusThreshold ? parseFloat(bonusThreshold) : null;
    if (bonusRate !== undefined) data.bonusRate = bonusRate ? parseFloat(bonusRate) : null;

    const rule = await prisma.commissionRule.update({
      where: { id: req.params.id },
      data,
    });
    res.json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/summary', authenticate, async (req, res) => {
  try {
    const payouts = await prisma.commissionPayout.findMany({
      include: {
        salesRep: { select: { name: true } },
      },
    });

    const totalPending = payouts.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
    const totalApproved = payouts.filter(p => p.status === 'APPROVED').reduce((s, p) => s + p.amount, 0);
    const totalPaid = payouts.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);

    const byRep = payouts.reduce((acc, p) => {
      const name = p.salesRep.name;
      if (!acc[name]) acc[name] = { pending: 0, paid: 0, total: 0 };
      acc[name].total += p.amount;
      if (p.status === 'PENDING' || p.status === 'APPROVED') acc[name].pending += p.amount;
      if (p.status === 'PAID') acc[name].paid += p.amount;
      return acc;
    }, {});

    res.json({ totalPending, totalApproved, totalPaid, byRep });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/payouts', authenticate, async (req, res) => {
  try {
    const { repId, status, period } = req.query;
    const where = {};
    if (repId) where.salesRepId = repId;
    if (status) where.status = status;
    if (period) where.period = period;

    const payouts = await prisma.commissionPayout.findMany({
      where,
      include: {
        salesRep: { select: { id: true, name: true } },
        rule: { select: { name: true, type: true } },
        deal: { select: { revenue: true, date: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/payouts', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { salesRepId, ruleId, dealId, amount, period, notes } = req.body;
    const payout = await prisma.commissionPayout.create({
      data: {
        salesRepId,
        ruleId,
        dealId: dealId || null,
        amount: parseFloat(amount),
        period,
        notes,
      },
      include: {
        salesRep: { select: { id: true, name: true } },
        rule: { select: { name: true, type: true } },
      },
    });
    res.status(201).json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/payouts/:id/status', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { status } = req.body;
    const data = { status };
    if (status === 'PAID') data.paidAt = new Date();

    const payout = await prisma.commissionPayout.update({
      where: { id: req.params.id },
      data,
      include: {
        salesRep: { select: { id: true, name: true } },
        rule: { select: { name: true } },
      },
    });
    res.json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

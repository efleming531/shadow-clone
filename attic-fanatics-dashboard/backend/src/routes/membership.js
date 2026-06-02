const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/plans', authenticate, async (req, res) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      include: { _count: { select: { memberships: true } } },
      orderBy: { price: 'asc' },
    });
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/plans', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { name, price, billingCycle, features } = req.body;
    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        price: parseFloat(price),
        billingCycle,
        features: Array.isArray(features) ? features : [],
      },
    });
    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/plans/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { price, features, ...rest } = req.body;
    const data = { ...rest };
    if (price !== undefined) data.price = parseFloat(price);
    if (features !== undefined) data.features = Array.isArray(features) ? features : [];

    const plan = await prisma.membershipPlan.update({
      where: { id: req.params.id },
      data,
    });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const [active, cancelled, plans] = await Promise.all([
      prisma.membership.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: { select: { price: true, billingCycle: true } } },
      }),
      prisma.membership.count({ where: { status: 'CANCELLED' } }),
      prisma.membershipPlan.findMany({ select: { id: true, name: true, price: true, billingCycle: true } }),
    ]);

    const mrr = active.reduce((sum, m) => {
      const p = m.plan.price;
      if (m.plan.billingCycle === 'MONTHLY') return sum + p;
      if (m.plan.billingCycle === 'QUARTERLY') return sum + p / 3;
      if (m.plan.billingCycle === 'ANNUAL') return sum + p / 12;
      return sum;
    }, 0);

    const total = await prisma.membership.count();
    const churnRate = total > 0 ? cancelled / total : 0;

    res.json({ mrr, activeCount: active.length, cancelledCount: cancelled, churnRate, plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/members', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const members = await prisma.membership.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/enroll', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { customerId, planId, startDate, notes } = req.body;

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const start = new Date(startDate || Date.now());
    let renewalDate = new Date(start);
    if (plan.billingCycle === 'MONTHLY') renewalDate.setMonth(renewalDate.getMonth() + 1);
    else if (plan.billingCycle === 'QUARTERLY') renewalDate.setMonth(renewalDate.getMonth() + 3);
    else if (plan.billingCycle === 'ANNUAL') renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const membership = await prisma.membership.create({
      data: { customerId, planId, startDate: start, renewalDate, notes },
      include: {
        customer: { select: { id: true, name: true } },
        plan: true,
      },
    });

    res.status(201).json(membership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/cancel', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const membership = await prisma.membership.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: {
        customer: { select: { id: true, name: true } },
        plan: true,
      },
    });
    res.json(membership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

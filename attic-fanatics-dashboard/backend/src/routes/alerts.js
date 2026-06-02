const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const rules = await prisma.alertRule.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(rules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { name, metric, condition, threshold, period } = req.body;
    const rule = await prisma.alertRule.create({
      data: {
        name,
        metric,
        condition,
        threshold: parseFloat(threshold),
        period: period || 'daily',
      },
    });
    res.status(201).json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { threshold, ...rest } = req.body;
    const data = { ...rest };
    if (threshold !== undefined) data.threshold = parseFloat(threshold);

    const rule = await prisma.alertRule.update({
      where: { id: req.params.id },
      data,
    });
    res.json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    await prisma.alertRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

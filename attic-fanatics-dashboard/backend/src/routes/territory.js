const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { state, minRevenue } = req.query;
    const where = {};
    if (state) where.state = state;
    if (minRevenue) where.revenue = { gte: parseFloat(minRevenue) };

    const territories = await prisma.territoryData.findMany({
      where,
      orderBy: { revenue: 'desc' },
    });

    const totals = territories.reduce(
      (acc, t) => ({
        revenue: acc.revenue + t.revenue,
        dealCount: acc.dealCount + t.dealCount,
        leadCount: acc.leadCount + t.leadCount,
      }),
      { revenue: 0, dealCount: 0, leadCount: 0 }
    );

    res.json({ territories, totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { zipCode, city, state, dealCount, revenue, leadCount } = req.body;
    const territory = await prisma.territoryData.upsert({
      where: { zipCode },
      update: {
        dealCount: parseInt(dealCount) || 0,
        revenue: parseFloat(revenue) || 0,
        leadCount: parseInt(leadCount) || 0,
      },
      create: {
        zipCode,
        city,
        state,
        dealCount: parseInt(dealCount) || 0,
        revenue: parseFloat(revenue) || 0,
        leadCount: parseInt(leadCount) || 0,
      },
    });
    res.status(201).json(territory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { dealCount, revenue, leadCount, ...rest } = req.body;
    const data = { ...rest };
    if (dealCount !== undefined) data.dealCount = parseInt(dealCount) || 0;
    if (revenue !== undefined) data.revenue = parseFloat(revenue) || 0;
    if (leadCount !== undefined) data.leadCount = parseInt(leadCount) || 0;

    const territory = await prisma.territoryData.update({
      where: { id: req.params.id },
      data,
    });
    res.json(territory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;

    const materials = await prisma.materialsDB.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const grouped = materials.reduce((acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    }, {});

    res.json({ materials, grouped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { category, name, unit, costPerUnit, markupPct } = req.body;
    const material = await prisma.materialsDB.create({
      data: {
        category,
        name,
        unit,
        costPerUnit: parseFloat(costPerUnit),
        markupPct: parseFloat(markupPct) || 40,
      },
    });
    res.status(201).json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { costPerUnit, markupPct, ...rest } = req.body;
    const data = { ...rest };
    if (costPerUnit !== undefined) data.costPerUnit = parseFloat(costPerUnit);
    if (markupPct !== undefined) data.markupPct = parseFloat(markupPct);

    const material = await prisma.materialsDB.update({
      where: { id: req.params.id },
      data,
    });
    res.json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    await prisma.materialsDB.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

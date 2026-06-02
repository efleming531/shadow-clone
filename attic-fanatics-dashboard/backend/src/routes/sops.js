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

    const sops = await prisma.sOP.findMany({
      where,
      include: { createdBy: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(sops);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await prisma.sOP.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
    });
    res.json(categories.map(c => ({ category: c.category, count: c._count })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const sop = await prisma.sOP.findUnique({
      where: { id: req.params.id },
      include: { createdBy: { select: { name: true } } },
    });
    if (!sop) return res.status(404).json({ error: 'SOP not found' });
    res.json(sop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { title, category, content } = req.body;
    const sop = await prisma.sOP.create({
      data: { title, category, content, createdById: req.user.id },
      include: { createdBy: { select: { name: true } } },
    });
    res.status(201).json(sop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const existing = await prisma.sOP.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'SOP not found' });

    const sop = await prisma.sOP.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        version: existing.version + 1,
      },
      include: { createdBy: { select: { name: true } } },
    });
    res.json(sop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    await prisma.sOP.update({
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

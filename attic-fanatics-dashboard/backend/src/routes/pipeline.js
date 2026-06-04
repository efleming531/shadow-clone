const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const stages = await prisma.pipelineStage.findMany({ orderBy: { order: 'asc' } });
    res.json(stages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { label, color = 'gray', isWon = false, isLost = false } = req.body;
    if (!label?.trim()) return res.status(400).json({ error: 'Label is required' });

    const slug = label.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    const exists = await prisma.pipelineStage.findUnique({ where: { slug } });
    if (exists) return res.status(400).json({ error: 'A stage with that name already exists' });

    const last = await prisma.pipelineStage.findFirst({ orderBy: { order: 'desc' } });
    const order = last ? last.order + 1 : 0;

    const stage = await prisma.pipelineStage.create({
      data: { slug, label: label.trim(), color, order, isWon, isLost },
    });
    res.status(201).json(stage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { label, color, order, isWon, isLost } = req.body;
    const data = {};
    if (label !== undefined) data.label = label.trim();
    if (color !== undefined) data.color = color;
    if (order !== undefined) data.order = order;
    if (isWon !== undefined) data.isWon = isWon;
    if (isLost !== undefined) data.isLost = isLost;

    const stage = await prisma.pipelineStage.update({ where: { id: req.params.id }, data });
    res.json(stage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const stage = await prisma.pipelineStage.findUnique({ where: { id: req.params.id } });
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const leadCount = await prisma.lead.count({ where: { stage: stage.slug } });
    if (leadCount > 0) {
      return res.status(400).json({
        error: `${leadCount} lead${leadCount !== 1 ? 's are' : ' is'} in this stage. Move them to another stage before deleting.`,
      });
    }

    await prisma.pipelineStage.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

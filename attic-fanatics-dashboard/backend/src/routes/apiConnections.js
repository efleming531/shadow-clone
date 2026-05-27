const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const connections = await prisma.apiConnection.findMany();
    res.json(connections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:provider/key', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    const { provider } = req.params;
    const { apiKey } = req.body;

    const connection = await prisma.apiConnection.upsert({
      where: { provider },
      update: { apiKey, isActive: false },
      create: { provider, apiKey, isActive: false },
    });
    res.json(connection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

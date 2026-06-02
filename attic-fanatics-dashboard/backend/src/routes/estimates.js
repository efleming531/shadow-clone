const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

let estimateCounter = 1000;

async function nextEstimateNumber() {
  const last = await prisma.estimate.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } });
  if (last) {
    const n = parseInt(last.number.replace('EST-', ''), 10);
    if (!isNaN(n)) return `EST-${n + 1}`;
  }
  return `EST-${estimateCounter++}`;
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const estimates = await prisma.estimate.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(estimates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: req.params.id },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true, address: true, city: true, state: true } },
        createdBy: { select: { name: true } },
      },
    });

    if (!estimate) return res.status(404).json({ error: 'Estimate not found' });
    res.json(estimate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { leadId, lineItems, tax, discount, notes, validUntil } = req.body;

    const items = Array.isArray(lineItems) ? lineItems : [];
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.qty) * parseFloat(item.unitPrice)), 0);
    const taxAmt = parseFloat(tax) || 0;
    const discountAmt = parseFloat(discount) || 0;
    const total = subtotal + taxAmt - discountAmt;

    const number = await nextEstimateNumber();

    const estimate = await prisma.estimate.create({
      data: {
        leadId,
        number,
        lineItems: items,
        subtotal,
        tax: taxAmt,
        discount: discountAmt,
        total,
        notes,
        validUntil: validUntil ? new Date(validUntil) : null,
        createdById: req.user.id,
      },
      include: {
        lead: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    });

    res.status(201).json(estimate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { lineItems, tax, discount, notes, validUntil, status } = req.body;

    const data = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (validUntil !== undefined) data.validUntil = validUntil ? new Date(validUntil) : null;

    if (lineItems !== undefined) {
      const items = Array.isArray(lineItems) ? lineItems : [];
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.qty) * parseFloat(item.unitPrice)), 0);
      const taxAmt = parseFloat(tax) || 0;
      const discountAmt = parseFloat(discount) || 0;
      data.lineItems = items;
      data.subtotal = subtotal;
      data.tax = taxAmt;
      data.discount = discountAmt;
      data.total = subtotal + taxAmt - discountAmt;
    }

    if (status === 'SENT') data.sentAt = new Date();
    if (status === 'ACCEPTED') data.acceptedAt = new Date();

    const estimate = await prisma.estimate.update({
      where: { id: req.params.id },
      data,
      include: {
        lead: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    });

    res.json(estimate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    await prisma.estimate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

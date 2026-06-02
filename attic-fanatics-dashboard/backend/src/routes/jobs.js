const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

let jobCounter = 1000;

async function nextJobNumber() {
  const last = await prisma.job.findFirst({ orderBy: { createdAt: 'desc' }, select: { jobNumber: true } });
  if (last) {
    const n = parseInt(last.jobNumber.replace('JOB-', ''), 10);
    if (!isNaN(n)) return `JOB-${n + 1}`;
  }
  return `JOB-${jobCounter++}`;
}

router.get('/stats', authenticate, async (req, res) => {
  try {
    const [total, scheduled, inProgress, completed, revenue] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'SCHEDULED' } }),
      prisma.job.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.aggregate({ _sum: { totalRevenue: true, cashCollected: true } }),
    ]);

    res.json({
      total, scheduled, inProgress, completed,
      totalRevenue: revenue._sum.totalRevenue || 0,
      cashCollected: revenue._sum.cashCollected || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, repId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (repId) where.assignedRepId = repId;

    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, city: true } },
        assignedRep: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        assignedRep: true,
        lead: { select: { id: true, name: true, stage: true } },
      },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { customerId, leadId, assignedRepId, serviceType, description, scheduledDate, totalRevenue, cashCollected, notes } = req.body;

    const jobNumber = await nextJobNumber();

    const job = await prisma.job.create({
      data: {
        jobNumber,
        customerId,
        leadId: leadId || null,
        assignedRepId: assignedRepId || null,
        serviceType,
        description,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        totalRevenue: parseFloat(totalRevenue) || 0,
        cashCollected: parseFloat(cashCollected) || 0,
        notes,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, city: true } },
        assignedRep: { select: { name: true } },
      },
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { status, scheduledDate, completedDate, totalRevenue, cashCollected, ...rest } = req.body;

    const data = { ...rest };
    if (status) data.status = status;
    if (scheduledDate !== undefined) data.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (completedDate !== undefined) data.completedDate = completedDate ? new Date(completedDate) : null;
    if (totalRevenue !== undefined) data.totalRevenue = parseFloat(totalRevenue) || 0;
    if (cashCollected !== undefined) data.cashCollected = parseFloat(cashCollected) || 0;

    const job = await prisma.job.update({
      where: { id: req.params.id },
      data,
      include: {
        customer: { select: { id: true, name: true, phone: true, city: true } },
        assignedRep: { select: { name: true } },
      },
    });

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRole('OWNER'), async (req, res) => {
  try {
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

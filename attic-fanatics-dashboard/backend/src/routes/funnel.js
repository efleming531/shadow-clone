const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { computeMetrics, getDateRange } = require('../utils/metrics');
const multer = require('multer');
const Papa = require('papaparse');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/sources', authenticate, async (req, res) => {
  const sources = await prisma.leadSource.findMany();
  res.json(sources);
});

router.get('/:slug', authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    const { period = 'monthly' } = req.query;
    const { start, end } = getDateRange(period);

    const source = await prisma.leadSource.findUnique({ where: { slug } });
    if (!source) return res.status(404).json({ error: 'Lead source not found' });

    const funnelData = await prisma.funnelData.findMany({
      where: { leadSourceId: source.id, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    const metrics = computeMetrics(funnelData);

    const timeSeriesData = funnelData.map(row => ({
      date: row.date,
      leadsGenerated: row.leadsGenerated,
      callsBooked: row.callsBooked,
      callsShowed: row.callsShowed,
      callsClosed: row.callsClosed,
      adSpend: row.adSpend,
      revenue: row.revenue,
    }));

    const qualityCounts = funnelData.reduce((acc, row) => {
      acc[row.leadQuality] = (acc[row.leadQuality] || 0) + 1;
      return acc;
    }, {});

    res.json({ source, metrics, timeSeriesData, qualityCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/entry', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { leadSourceSlug, date, ...rest } = req.body;
    const source = await prisma.leadSource.findUnique({ where: { slug: leadSourceSlug } });
    if (!source) return res.status(404).json({ error: 'Lead source not found' });

    const entry = await prisma.funnelData.create({
      data: {
        leadSourceId: source.id,
        date: new Date(date),
        adSpend: parseFloat(rest.adSpend) || 0,
        impressions: parseInt(rest.impressions) || 0,
        clicks: parseInt(rest.clicks) || 0,
        leadsGenerated: parseInt(rest.leadsGenerated) || 0,
        formCompletions: parseInt(rest.formCompletions) || 0,
        callsBooked: parseInt(rest.callsBooked) || 0,
        callsShowed: parseInt(rest.callsShowed) || 0,
        callsClosed: parseInt(rest.callsClosed) || 0,
        revenue: parseFloat(rest.revenue) || 0,
        cashCollected: parseFloat(rest.cashCollected) || 0,
        leadQuality: rest.leadQuality || 'WARM',
        notes: rest.notes || null,
        createdById: req.user.id,
      },
    });

    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/import-csv', authenticate, requireRole('OWNER', 'MANAGER'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const csv = req.file.buffer.toString('utf-8');
    const { data, errors } = Papa.parse(csv, { header: true, skipEmptyLines: true });

    if (errors.length > 0) return res.status(400).json({ error: 'CSV parse error', details: errors });

    res.json({ preview: data.slice(0, 10), totalRows: data.length, columns: Object.keys(data[0] || {}) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/import-csv/confirm', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { rows, columnMapping, leadSourceSlug } = req.body;
    const source = await prisma.leadSource.findUnique({ where: { slug: leadSourceSlug } });
    if (!source) return res.status(404).json({ error: 'Lead source not found' });

    const map = columnMapping;
    const created = await Promise.all(
      rows.map(row =>
        prisma.funnelData.create({
          data: {
            leadSourceId: source.id,
            date: new Date(row[map.date] || new Date()),
            adSpend: parseFloat(row[map.adSpend]) || 0,
            impressions: parseInt(row[map.impressions]) || 0,
            clicks: parseInt(row[map.clicks]) || 0,
            leadsGenerated: parseInt(row[map.leadsGenerated]) || 0,
            formCompletions: parseInt(row[map.formCompletions]) || 0,
            callsBooked: parseInt(row[map.callsBooked]) || 0,
            callsShowed: parseInt(row[map.callsShowed]) || 0,
            callsClosed: parseInt(row[map.callsClosed]) || 0,
            revenue: parseFloat(row[map.revenue]) || 0,
            cashCollected: parseFloat(row[map.cashCollected]) || 0,
            leadQuality: row[map.leadQuality] || 'WARM',
            notes: row[map.notes] || null,
            createdById: req.user.id,
          },
        })
      )
    );

    res.json({ imported: created.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

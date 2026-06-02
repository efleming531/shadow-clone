const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany();

    const total = reviews.length;
    const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const responseRate = total > 0 ? reviews.filter(r => r.responded).length / total : 0;

    const byPlatform = reviews.reduce((acc, r) => {
      if (!acc[r.platform]) acc[r.platform] = { count: 0, total: 0 };
      acc[r.platform].count++;
      acc[r.platform].total += r.rating;
      return acc;
    }, {});

    Object.keys(byPlatform).forEach(p => {
      byPlatform[p].avg = byPlatform[p].total / byPlatform[p].count;
    });

    const byRating = [1, 2, 3, 4, 5].map(r => ({
      rating: r,
      count: reviews.filter(rv => rv.rating === r).length,
    }));

    res.json({ total, avgRating, responseRate, byPlatform, byRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reviews', authenticate, async (req, res) => {
  try {
    const { platform, rating, responded } = req.query;
    const where = {};
    if (platform) where.platform = platform;
    if (rating) where.rating = parseInt(rating);
    if (responded !== undefined) where.responded = responded === 'true';

    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { reviewDate: 'desc' },
    });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reviews', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { customerId, platform, rating, reviewText, reviewDate } = req.body;

    const review = await prisma.review.create({
      data: {
        customerId: customerId || null,
        platform,
        rating: parseInt(rating),
        reviewText,
        reviewDate: new Date(reviewDate || Date.now()),
      },
      include: { customer: { select: { id: true, name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/reviews/:id/respond', authenticate, requireRole('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { responseText } = req.body;
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { responded: true, responseText },
      include: { customer: { select: { id: true, name: true } } },
    });
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

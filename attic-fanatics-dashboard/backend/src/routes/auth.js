const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = {
      userId: user.id,
      tenantId: user.tenantId || null,
      role: user.role,
      firstName: user.firstName || user.name || '',
      lastName: user.lastName || '',
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Update lastLogin
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName || user.name || '',
        lastName: user.lastName || '',
        role: user.role,
        tenantId: user.tenantId || null,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register (protected — admin only)
router.post('/register', async (req, res) => {
  // inline auth check
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    if (!['admin', 'OWNER'].includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });

    const { email, password, firstName, lastName, role, phone } = req.body;
    if (!email || !password || !firstName || !lastName) return res.status(400).json({ error: 'Missing required fields' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        phone: phone || null,
        role: role || 'sales_rep',
        tenantId: decoded.tenantId || null,
        active: true,
        isActive: true,
      }
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || (!user.isActive && !user.active)) return res.status(401).json({ error: 'User not found or inactive' });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName || user.name || '',
      lastName: user.lastName || '',
      role: user.role,
      tenantId: user.tenantId || null,
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/auth/me
router.patch('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);

    const { name, email, currentPassword, newPassword } = req.body;

    if (newPassword) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      const valid = await bcrypt.compare(currentPassword || '', user.passwordHash);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const data = {};
    if (name?.trim()) data.name = name.trim();
    if (email?.trim()) {
      const existing = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), NOT: { id: decoded.userId } },
      });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
      data.email = email.toLowerCase().trim();
    }
    if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id: decoded.userId },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout — stateless
router.post('/logout', (req, res) => res.json({ success: true }));

// POST /api/auth/customer-login
router.post('/customer-login', async (req, res) => {
  try {
    const { portalToken } = req.body;
    if (!portalToken) return res.status(400).json({ error: 'Portal token required' });

    const customer = await prisma.customer.findFirst({ where: { portalToken } });
    if (!customer) return res.status(401).json({ error: 'Invalid portal token' });

    const payload = { customerId: customer.id, role: 'customer', tenantId: customer.tenantId || null };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      customer: {
        id: customer.id,
        firstName: customer.name?.split(' ')[0] || '',
        lastName: customer.name?.split(' ').slice(1).join(' ') || '',
        name: customer.name,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

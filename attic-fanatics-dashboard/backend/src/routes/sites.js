const express = require('express');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { getTemplate, generateAssessmentHTML } = require('../utils/templates/index');

const prisma = new PrismaClient();

// ── helpers ────────────────────────────────────────────────────────────────

function siteDir(slug) {
  return path.join(__dirname, '../static/sites', slug);
}

function writeSiteFiles(site) {
  const dir = siteDir(site.slug);
  fs.mkdirSync(dir, { recursive: true });
  const templateFn = getTemplate(site.template);
  fs.writeFileSync(path.join(dir, 'index.html'), templateFn(site), 'utf8');
  const assessmentFn = getTemplate(site.template + '-assessment');
  fs.writeFileSync(path.join(dir, 'assessment.html'), assessmentFn(site), 'utf8');
}

async function getOrCreateAevum() {
  let site = await prisma.siteConfig.findUnique({ where: { tenantId: 'aevum-roofing' } });
  if (!site) {
    site = await prisma.siteConfig.create({
      data: { tenantId: 'aevum-roofing', slug: 'aevum', template: 'aevum-brutalist' },
    });
  }
  if (!site.slug || site.slug === site.id) {
    site = await prisma.siteConfig.update({
      where: { id: site.id },
      data: { slug: 'aevum' },
    });
  }
  return site;
}

// ── HTML (public) router ────────────────────────────────────────────────────

const sitesHTMLRouter = express.Router();

sitesHTMLRouter.get('/:slug', async (req, res) => {
  try {
    const site = await prisma.siteConfig.findFirst({ where: { slug: req.params.slug } });
    if (!site) return res.status(404).send('Site not found');
    const indexPath = path.join(siteDir(site.slug), 'index.html');
    const needsRegen = !fs.existsSync(indexPath) ||
      fs.readFileSync(indexPath, 'utf8').includes('placeholder');
    if (needsRegen) writeSiteFiles(site);
    res.sendFile(indexPath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

sitesHTMLRouter.get('/:slug/assessment', async (req, res) => {
  try {
    const site = await prisma.siteConfig.findFirst({ where: { slug: req.params.slug } });
    if (!site) return res.status(404).send('Site not found');
    const assessPath = path.join(siteDir(site.slug), 'assessment.html');
    if (!fs.existsSync(assessPath)) writeSiteFiles(site);
    res.sendFile(assessPath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

// ── JSON API router ─────────────────────────────────────────────────────────

const sitesAPIRouter = express.Router();

sitesAPIRouter.get('/', authenticate, requireRole('OWNER', 'MANAGER', 'admin', 'manager'), async (req, res) => {
  try {
    const sites = await prisma.siteConfig.findMany({
      select: {
        id: true, slug: true, template: true, customDomain: true,
        publishedAt: true, isLive: true,
        heroHeadline: true, ctaText: true, tagline: true, serviceArea: true,
        updatedAt: true,
        _count: { select: { deploys: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(sites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

sitesAPIRouter.get('/:slug', authenticate, requireRole('OWNER', 'MANAGER', 'admin', 'manager'), async (req, res) => {
  try {
    const site = await prisma.siteConfig.findFirst({
      where: { slug: req.params.slug },
      include: {
        deploys: { orderBy: { deployedAt: 'desc' }, take: 5 },
      },
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

sitesAPIRouter.post('/', authenticate, requireRole('OWNER', 'admin'), async (req, res) => {
  try {
    const { slug, template = 'aevum-brutalist', heroHeadline, heroSub, ctaText, tagline, serviceArea, customDomain } = req.body;
    if (!slug) return res.status(400).json({ error: 'slug is required' });
    if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'slug must be lowercase alphanumeric and hyphens only' });
    const existing = await prisma.siteConfig.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ error: 'slug already taken' });
    const data = { slug, template, tenantId: slug };
    if (heroHeadline) data.heroHeadline = heroHeadline;
    if (heroSub) data.heroSub = heroSub;
    if (ctaText) data.ctaText = ctaText;
    if (tagline) data.tagline = tagline;
    if (serviceArea) data.serviceArea = serviceArea;
    if (customDomain) data.customDomain = customDomain;
    const site = await prisma.siteConfig.create({ data });
    writeSiteFiles(site);
    res.status(201).json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

sitesAPIRouter.patch('/:slug', authenticate, requireRole('OWNER', 'MANAGER', 'admin', 'manager'), async (req, res) => {
  try {
    const { heroHeadline, heroSub, ctaText, tagline, serviceArea, template, customDomain } = req.body;
    const current = await prisma.siteConfig.findFirst({ where: { slug: req.params.slug } });
    if (!current) return res.status(404).json({ error: 'Site not found' });
    const data = {};
    if (heroHeadline !== undefined) data.heroHeadline = heroHeadline;
    if (heroSub !== undefined) data.heroSub = heroSub;
    if (ctaText !== undefined) data.ctaText = ctaText;
    if (tagline !== undefined) data.tagline = tagline;
    if (serviceArea !== undefined) data.serviceArea = serviceArea;
    if (template !== undefined) data.template = template;
    if (customDomain !== undefined) data.customDomain = customDomain || null;
    const site = await prisma.siteConfig.update({ where: { id: current.id }, data });
    writeSiteFiles(site);
    res.json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

sitesAPIRouter.post('/:slug/publish', authenticate, requireRole('OWNER', 'MANAGER', 'admin', 'manager'), async (req, res) => {
  try {
    const site = await prisma.siteConfig.findFirst({ where: { slug: req.params.slug } });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    const templateFn = getTemplate(site.template);
    const html = templateFn(site);
    writeSiteFiles(site);
    const deploy = await prisma.siteDeploy.create({
      data: {
        siteId: site.id,
        deployedBy: req.user.userId || req.user.id || 'unknown',
        htmlSnapshot: html,
        configSnapshot: {
          heroHeadline: site.heroHeadline,
          heroSub: site.heroSub,
          ctaText: site.ctaText,
          tagline: site.tagline,
          serviceArea: site.serviceArea,
          template: site.template,
        },
      },
    });
    const now = new Date();
    await prisma.siteConfig.update({
      where: { id: site.id },
      data: { publishedAt: now, isLive: true },
    });
    res.json({ success: true, publishedAt: now, deployId: deploy.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

sitesAPIRouter.post('/:slug/rollback/:deployId', authenticate, requireRole('OWNER', 'admin'), async (req, res) => {
  try {
    const site = await prisma.siteConfig.findFirst({ where: { slug: req.params.slug } });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    const deploy = await prisma.siteDeploy.findUnique({ where: { id: req.params.deployId } });
    if (!deploy || deploy.siteId !== site.id) return res.status(404).json({ error: 'Deploy not found' });
    const snap = deploy.configSnapshot;
    const restored = await prisma.siteConfig.update({
      where: { id: site.id },
      data: {
        heroHeadline: snap.heroHeadline,
        heroSub: snap.heroSub,
        ctaText: snap.ctaText,
        tagline: snap.tagline,
        serviceArea: snap.serviceArea,
        template: snap.template || site.template,
      },
    });
    const dir = siteDir(site.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), deploy.htmlSnapshot, 'utf8');
    const assessmentFn = getTemplate((snap.template || site.template) + '-assessment');
    fs.writeFileSync(path.join(dir, 'assessment.html'), assessmentFn(restored), 'utf8');
    const rollbackDeploy = await prisma.siteDeploy.create({
      data: {
        siteId: site.id,
        deployedBy: req.user.userId || req.user.id || 'unknown',
        htmlSnapshot: deploy.htmlSnapshot,
        configSnapshot: { ...snap, rollbackFrom: deploy.id },
      },
    });
    res.json({ success: true, restoredFrom: deploy.id, newDeployId: rollbackDeploy.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

sitesAPIRouter.post('/:slug/connect-domain', authenticate, requireRole('OWNER', 'admin'), async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'domain is required' });
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }
    const site = await prisma.siteConfig.findFirst({ where: { slug: req.params.slug } });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    await prisma.siteConfig.update({ where: { id: site.id }, data: { customDomain: domain } });
    const railwayUrl = process.env.RAILWAY_PUBLIC_URL || 'your-app.up.railway.app';
    res.json({
      success: true,
      domain,
      instructions: {
        type: 'CNAME',
        host: '@',
        value: railwayUrl,
        ttl: 'Auto',
        note: `Add this DNS CNAME record at your registrar to point ${domain} to your Forge-hosted site.`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

sitesAPIRouter.get('/:slug/deploys', authenticate, requireRole('OWNER', 'MANAGER', 'admin', 'manager'), async (req, res) => {
  try {
    const site = await prisma.siteConfig.findFirst({ where: { slug: req.params.slug } });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    const deploys = await prisma.siteDeploy.findMany({
      where: { siteId: site.id },
      orderBy: { deployedAt: 'desc' },
    });
    const userIds = [...new Set(deploys.map(d => d.deployedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
    const enriched = deploys.map(d => ({
      id: d.id,
      deployedBy: userMap[d.deployedBy] || d.deployedBy,
      deployedAt: d.deployedAt,
      preview: {
        heroHeadline: d.configSnapshot?.heroHeadline,
        ctaText: d.configSnapshot?.ctaText,
      },
    }));
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assessment form submission router (mounted at /api/site in server.js)
const assessmentRouter = express.Router();
assessmentRouter.post('/assessment', async (req, res) => {
  try {
    const { name, email, phone, address, state, projectType, budget, notes, siteSlug } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
    let leadSource = await prisma.leadSource.findFirst({ where: { slug: 'organic' } });
    if (!leadSource) leadSource = await prisma.leadSource.findFirst();
    if (leadSource) {
      await prisma.lead.create({
        data: {
          name,
          phone: phone || null,
          email,
          address: address || null,
          leadSourceId: leadSource.id,
          stage: 'NEW',
          notes: [
            projectType && `Type: ${projectType}`,
            budget && `Budget: ${budget}`,
            state && `State: ${state}`,
            notes,
          ].filter(Boolean).join('\n') || null,
        },
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { sitesHTMLRouter, sitesAPIRouter, assessmentRouter, writeSiteFiles, getOrCreateAevum };

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();
const STATIC_PATH = path.join(__dirname, '../static/aevum/index.html');

function writeHTML(html) {
  fs.mkdirSync(path.dirname(STATIC_PATH), { recursive: true });
  fs.writeFileSync(STATIC_PATH, html, 'utf8');
}

async function getOrCreateConfig() {
  let config = await prisma.siteConfig.findUnique({ where: { tenantId: 'aevum-roofing' } });
  if (!config) {
    config = await prisma.siteConfig.create({ data: { tenantId: 'aevum-roofing' } });
    writeHTML(generateHTML(config));
  }
  return config;
}

function generateHTML(config) {
  const { heroHeadline, heroSub, ctaText, tagline, serviceArea } = config;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>AEVUM — ${tagline}</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #E8E4DC;
    --cream-dark: #D8D4CC;
    --ink: #0D0D0D;
    --ink-mid: #2A2A2A;
    --rule: #1A1A1A;
    --muted: #6A6A6A;
    --bebas: 'Bebas Neue', sans-serif;
    --mono: 'Courier Prime', monospace;
    --serif: 'IM Fell English', serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--cream);
    color: var(--ink);
    font-family: var(--mono);
    overflow-x: hidden;
    cursor: crosshair;
  }

  /* ── NAV ── */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 2.5rem;
    background: var(--cream);
    border-bottom: 2px solid var(--ink);
  }

  .nav-logo {
    font-family: var(--bebas);
    font-size: 1.6rem;
    letter-spacing: 0.12em;
    color: var(--ink);
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 2.5rem;
    list-style: none;
  }

  .nav-links a {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--ink);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
  }

  .nav-links a:hover { border-color: var(--ink); }

  .nav-cta {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--cream);
    background: var(--ink);
    padding: 0.6rem 1.4rem;
    text-decoration: none;
    transition: background 0.2s;
    cursor: crosshair;
  }

  .nav-cta:hover { background: var(--ink-mid); }

  /* ── HERO ── */
  #hero {
    min-height: 100vh;
    padding-top: 5rem;
    display: grid;
    grid-template-rows: 1fr auto;
    border-bottom: 2px solid var(--ink);
    position: relative;
    overflow: hidden;
  }

  .hero-grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--cream-dark) 1px, transparent 1px),
      linear-gradient(90deg, var(--cream-dark) 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: 0.5;
    pointer-events: none;
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    padding: 4rem 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .hero-eyebrow {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .hero-eyebrow::before {
    content: '';
    display: block;
    width: 40px;
    height: 1px;
    background: var(--muted);
  }

  .hero-mark {
    font-family: var(--mono);
    font-size: 1.4rem;
    color: var(--ink);
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    font-weight: 700;
  }

  .hero-name {
    font-family: var(--bebas);
    font-size: clamp(6rem, 18vw, 16rem);
    line-height: 0.88;
    letter-spacing: 0.04em;
    color: var(--ink);
    margin-bottom: 1.5rem;
  }

  .hero-sub {
    font-family: var(--serif);
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    font-style: italic;
    color: var(--ink-mid);
    max-width: 520px;
    line-height: 1.5;
    margin-bottom: 3rem;
    border-left: 3px solid var(--ink);
    padding-left: 1.2rem;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .btn-primary {
    font-family: var(--bebas);
    font-size: 1.1rem;
    letter-spacing: 0.18em;
    color: var(--cream);
    background: var(--ink);
    padding: 1rem 2.8rem;
    text-decoration: none;
    border: 2px solid var(--ink);
    transition: all 0.2s;
    cursor: crosshair;
    display: inline-block;
  }

  .btn-primary:hover { background: transparent; color: var(--ink); }

  .btn-ghost {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--muted);
    text-decoration: none;
    border-bottom: 1px solid var(--muted);
    padding-bottom: 0.1rem;
    transition: color 0.2s, border-color 0.2s;
  }

  .btn-ghost:hover { color: var(--ink); border-color: var(--ink); }

  .hero-footnote {
    border-top: 2px solid var(--ink);
    padding: 1.2rem 2.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 2;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .hero-footnote-item {
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .hero-footnote-item strong {
    font-family: var(--bebas);
    font-size: 1.1rem;
    color: var(--ink);
    display: block;
    letter-spacing: 0.05em;
  }

  /* ── TICKER ── */
  .ticker-wrap {
    overflow: hidden;
    background: var(--ink);
    border-bottom: 2px solid var(--ink);
    padding: 0.85rem 0;
  }

  .ticker-track {
    display: flex;
    gap: 0;
    animation: ticker 30s linear infinite;
    white-space: nowrap;
  }

  .ticker-item {
    font-family: var(--bebas);
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    color: var(--cream);
    padding: 0 2.5rem;
    border-right: 1px solid #333;
    flex-shrink: 0;
  }

  .ticker-item span { color: #6A6A6A; margin-right: 0.5rem; }

  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ── SECTION BASE ── */
  section {
    padding: 6rem 2.5rem;
    border-bottom: 2px solid var(--ink);
  }

  .section-label {
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 3rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--cream-dark);
    max-width: 80px;
  }

  .section-title {
    font-family: var(--bebas);
    font-size: clamp(2.8rem, 6vw, 5rem);
    letter-spacing: 0.05em;
    color: var(--ink);
    line-height: 0.95;
    margin-bottom: 1.5rem;
  }

  /* ── STANDARD ── */
  #standard { background: var(--ink); }
  #standard .section-label { color: #555; }
  #standard .section-label::after { background: #333; }
  #standard .section-title { color: var(--cream); }

  .standard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0;
    border: 1px solid #2A2A2A;
    margin-top: 3rem;
  }

  .standard-col { padding: 2.5rem; border-right: 1px solid #2A2A2A; }
  .standard-col:last-child { border-right: none; }

  .standard-num {
    font-family: var(--bebas);
    font-size: 3.5rem;
    color: #2A2A2A;
    line-height: 1;
    margin-bottom: 1rem;
  }

  .standard-head {
    font-family: var(--bebas);
    font-size: 1.3rem;
    letter-spacing: 0.08em;
    color: var(--cream);
    margin-bottom: 0.8rem;
  }

  .standard-body {
    font-family: var(--mono);
    font-size: 0.72rem;
    line-height: 1.8;
    color: #888;
  }

  /* ── MATERIALS ── */
  #materials .section-title { margin-bottom: 3rem; }

  .materials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0;
    border: 2px solid var(--ink);
  }

  .material-card {
    padding: 2rem 1.8rem;
    border-right: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    transition: background 0.25s;
    cursor: crosshair;
  }

  .material-card:hover { background: var(--ink); }
  .material-card:hover .mat-name { color: var(--cream); }
  .material-card:hover .mat-sub { color: #777; }
  .material-card:hover .mat-icon { color: #333; }

  .mat-icon {
    font-family: var(--bebas);
    font-size: 2.5rem;
    color: var(--cream-dark);
    line-height: 1;
    margin-bottom: 1rem;
    transition: color 0.25s;
  }

  .mat-name {
    font-family: var(--bebas);
    font-size: 1.15rem;
    letter-spacing: 0.08em;
    color: var(--ink);
    margin-bottom: 0.4rem;
    transition: color 0.25s;
  }

  .mat-sub {
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    transition: color 0.25s;
  }

  /* ── PROCESS ── */
  #process { background: var(--cream-dark); }

  .process-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0;
    border: 2px solid var(--ink);
    margin-top: 3rem;
  }

  .process-step { padding: 2.5rem 2rem; border-right: 2px solid var(--ink); position: relative; }
  .process-step:last-child { border-right: none; }

  .step-num {
    font-family: var(--bebas);
    font-size: 5rem;
    color: #C8C4BC;
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .step-name {
    font-family: var(--bebas);
    font-size: 1.3rem;
    letter-spacing: 0.1em;
    color: var(--ink);
    margin-bottom: 0.8rem;
  }

  .step-desc {
    font-family: var(--mono);
    font-size: 0.7rem;
    line-height: 1.8;
    color: var(--muted);
  }

  .step-arrow {
    position: absolute;
    top: 2.5rem;
    right: 1rem;
    font-family: var(--mono);
    font-size: 1rem;
    color: #C8C4BC;
  }

  /* ── CTA ── */
  #cta-block { background: var(--ink); text-align: center; }
  #cta-block .section-label { color: #444; justify-content: center; }
  #cta-block .section-label::after { background: #333; }
  #cta-block .section-title { color: var(--cream); margin-bottom: 1.2rem; }

  .cta-intro {
    font-family: var(--serif);
    font-size: 1rem;
    font-style: italic;
    color: #666;
    max-width: 440px;
    margin: 0 auto 2.5rem;
    line-height: 1.7;
  }

  .cta-note {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    color: #333;
    margin-top: 1.5rem;
    text-transform: uppercase;
  }

  /* ── FOOTER ── */
  footer {
    background: var(--cream);
    padding: 2.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    border-top: 2px solid var(--ink);
  }

  .footer-meta {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: var(--muted);
    text-align: right;
    line-height: 1.8;
  }

  /* ── ANIMATIONS ── */
  .fade-up {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* ── RESPONSIVE ── */
  @media (hover: none) { body, button, a { cursor: auto; } }

  @media (max-width: 768px) {
    nav { padding: 1rem 1.2rem; }
    .nav-links { display: none; }
    section { padding: 4rem 1.2rem; }
    .hero-inner { padding: 3rem 1.2rem 1.5rem; }
    .hero-name { font-size: clamp(5rem, 22vw, 9rem); }
    .hero-footnote { padding: 1rem 1.2rem; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    footer { padding: 1.5rem 1.2rem; }
    .footer-meta { text-align: left; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="#" class="nav-logo" style="display:flex;flex-direction:column;gap:0;text-decoration:none;">
    <span style="font-family:var(--bebas);font-size:0.75rem;letter-spacing:0.3em;color:var(--muted);line-height:1;"><span style="color:#aaa;margin-right:0.2rem;">//</span>THE FORGE</span>
    <span style="font-family:var(--bebas);font-size:1.6rem;letter-spacing:0.12em;color:var(--ink);line-height:1;"><span style="color:var(--muted);margin-right:0.3rem;">//</span>AEVUM ROOFING</span>
  </a>
  <ul class="nav-links">
    <li><a href="#standard">The Standard</a></li>
    <li><a href="#materials">Materials</a></li>
    <li><a href="#process">Process</a></li>
  </ul>
  <a href="/site/aevum/assessment" class="nav-cta">${ctaText}</a>
</nav>

<!-- HERO -->
<section id="hero">
  <div class="hero-grid-bg"></div>
  <div class="hero-inner">
    <div class="hero-eyebrow">Premium Residential Roofing · ${serviceArea} · and Beyond</div>
    <div class="hero-mark">//</div>
    <h1 class="hero-name">AEVUM</h1>
    <p class="hero-sub">${heroSub}</p>
    <div class="hero-actions">
      <a href="/site/aevum/assessment" class="btn-primary">${ctaText}</a>
      <a href="#process" class="btn-ghost">See how it works</a>
    </div>
  </div>
  <div class="hero-footnote">
    <div class="hero-footnote-item"><strong>$10K+</strong>Minimum Project Value</div>
    <div class="hero-footnote-item"><strong>${serviceArea}</strong>Primary Service Corridor</div>
    <div class="hero-footnote-item"><strong>GAF Master Elite</strong>Certified Installer</div>
    <div class="hero-footnote-item"><strong>Luxury · Custom · Mega</strong>Residential Specialist</div>
  </div>
</section>

<!-- TICKER -->
<div class="ticker-wrap">
  <div class="ticker-track">
    <div class="ticker-item"><span>◆</span> GAF MASTER ELITE CERTIFIED</div>
    <div class="ticker-item"><span>◆</span> DAVINCI SLATE SPECIALIST</div>
    <div class="ticker-item"><span>◆</span> LUDOWICI CLAY TILE</div>
    <div class="ticker-item"><span>◆</span> STANDING SEAM COPPER</div>
    <div class="ticker-item"><span>◆</span> ZINCALUME METAL SYSTEMS</div>
    <div class="ticker-item"><span>◆</span> PROJECTS FROM $10K — $500K+</div>
    <div class="ticker-item"><span>◆</span> WHITE-GLOVE PROJECT MANAGEMENT</div>
    <div class="ticker-item"><span>◆</span> BUILT TO LAST AN ERA</div>
    <div class="ticker-item"><span>◆</span> GAF MASTER ELITE CERTIFIED</div>
    <div class="ticker-item"><span>◆</span> DAVINCI SLATE SPECIALIST</div>
    <div class="ticker-item"><span>◆</span> LUDOWICI CLAY TILE</div>
    <div class="ticker-item"><span>◆</span> STANDING SEAM COPPER</div>
    <div class="ticker-item"><span>◆</span> ZINCALUME METAL SYSTEMS</div>
    <div class="ticker-item"><span>◆</span> PROJECTS FROM $10K — $500K+</div>
    <div class="ticker-item"><span>◆</span> WHITE-GLOVE PROJECT MANAGEMENT</div>
    <div class="ticker-item"><span>◆</span> BUILT TO LAST AN ERA</div>
  </div>
</div>

<!-- THE STANDARD -->
<section id="standard">
  <div class="section-label">001 — The Aevum Standard</div>
  <h2 class="section-title">NOT A ROOFING<br>COMPANY.</h2>
  <div class="standard-grid">
    <div class="standard-col fade-up">
      <div class="standard-num">01</div>
      <div class="standard-head">Building Envelope Expertise</div>
      <div class="standard-body">We approach every roof as an architectural element, not a commodity replacement. Material selection, drainage engineering, and thermal performance are specified for each home — not templated from a catalog.</div>
    </div>
    <div class="standard-col fade-up">
      <div class="standard-num">02</div>
      <div class="standard-head">White-Glove Project Management</div>
      <div class="standard-body">A dedicated project lead manages your job from assessment through final certification. You'll have a direct line — no call centers, no crews you've never met. Every subcontractor is vetted and bonded by us.</div>
    </div>
    <div class="standard-col fade-up">
      <div class="standard-num">03</div>
      <div class="standard-head">Specialty Material Access</div>
      <div class="standard-body">We work with the material lines most contractors can't access — Ludowici clay tile, DaVinci composite slate, standing seam copper, and Zincalume metal systems. Your home deserves what's actually exceptional.</div>
    </div>
  </div>
</section>

<!-- MATERIALS -->
<section id="materials">
  <div class="section-label">002 — Material Systems</div>
  <h2 class="section-title">WHAT WE<br>WORK WITH.</h2>
  <div class="materials-grid">
    <div class="material-card fade-up"><div class="mat-icon">◈</div><div class="mat-name">Natural Slate</div><div class="mat-sub">150+ year lifespan</div></div>
    <div class="material-card fade-up"><div class="mat-icon">▦</div><div class="mat-name">Clay &amp; Terracotta Tile</div><div class="mat-sub">Ludowici · Old World</div></div>
    <div class="material-card fade-up"><div class="mat-icon">⬡</div><div class="mat-name">Standing Seam Metal</div><div class="mat-sub">Copper · Zinc · Steel</div></div>
    <div class="material-card fade-up"><div class="mat-icon">◉</div><div class="mat-name">DaVinci Composite</div><div class="mat-sub">Engineered slate &amp; shake</div></div>
    <div class="material-card fade-up"><div class="mat-icon">▲</div><div class="mat-name">GAF Timberline</div><div class="mat-sub">Master Elite · Lifetime</div></div>
    <div class="material-card fade-up"><div class="mat-icon">◫</div><div class="mat-name">Cedar Shake</div><div class="mat-sub">Old-growth · Hand-split</div></div>
  </div>
</section>

<!-- PROCESS -->
<section id="process">
  <div class="section-label">003 — How It Works</div>
  <h2 class="section-title">THE AEVUM<br>PROCESS.</h2>
  <div class="process-steps">
    <div class="process-step fade-up">
      <div class="step-num">01</div>
      <div class="step-arrow">→</div>
      <div class="step-name">Project Assessment</div>
      <div class="step-desc">A senior Aevum specialist visits the property. We evaluate structure, drainage, material fit, and long-term performance — not just what's failing now.</div>
    </div>
    <div class="process-step fade-up">
      <div class="step-num">02</div>
      <div class="step-arrow">→</div>
      <div class="step-name">Design &amp; Specification</div>
      <div class="step-desc">We produce a full material specification and project scope. You review it with your project lead — line by line, no surprises, no change-order games.</div>
    </div>
    <div class="process-step fade-up">
      <div class="step-num">03</div>
      <div class="step-arrow">→</div>
      <div class="step-name">Installation</div>
      <div class="step-desc">Our vetted crews execute to manufacturer spec. Your property is protected daily. We don't leave a site unsecured — ever.</div>
    </div>
    <div class="process-step fade-up">
      <div class="step-num">04</div>
      <div class="step-arrow"></div>
      <div class="step-name">Certification &amp; Warranty</div>
      <div class="step-desc">Post-install inspection, manufacturer certification, and your Aevum workmanship guarantee. Documentation delivered for your records and resale.</div>
    </div>
  </div>
</section>

<!-- CTA BLOCK -->
<section id="cta-block">
  <div class="section-label">004 — Start Here</div>
  <h2 class="section-title">${heroHeadline}</h2>
  <p class="cta-intro">We evaluate every project before accepting it. If it's the right fit, a specialist will reach out within one business day.</p>
  <a href="/site/aevum/assessment" class="btn-primary" style="font-size:1.1rem;padding:1.1rem 3rem;">${ctaText} →</a>
  <p class="cta-note">$10,000 Minimum · ${serviceArea} · Expanding Nationally</p>
</section>

<!-- FOOTER -->
<footer>
  <div style="display:flex;flex-direction:column;gap:0;">
    <span style="font-family:var(--bebas);font-size:0.65rem;letter-spacing:0.3em;color:var(--muted);line-height:1;"><span style="color:#aaa;">//</span>THE FORGE</span>
    <span style="font-family:var(--bebas);font-size:1.1rem;letter-spacing:0.12em;color:var(--ink);line-height:1;"><span style="color:var(--muted);">//</span>AEVUM ROOFING</span>
  </div>
  <div class="footer-meta">
    ${tagline}<br>
    ${serviceArea} · Expanding Nationally<br>
    © ${new Date().getFullYear()} Aevum Roofing. All Rights Reserved.
  </div>
</footer>

<script>
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 100);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
</script>

</body>
</html>`;
}

// GET /aevum — serves HTML (under /site) or JSON config (under /api/sites)
router.get('/aevum', async (req, res) => {
  try {
    if (req.baseUrl === '/site') {
      const isPlaceholder = !fs.existsSync(STATIC_PATH) ||
        fs.readFileSync(STATIC_PATH, 'utf8').includes('placeholder');
      if (isPlaceholder) {
        const config = await getOrCreateConfig();
        writeHTML(generateHTML(config));
      }
      return res.sendFile(STATIC_PATH);
    }
    const config = await getOrCreateConfig();
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/sites/aevum — update config + regenerate HTML
router.patch('/aevum', authenticate, async (req, res) => {
  try {
    const { heroHeadline, heroSub, ctaText, tagline, serviceArea } = req.body;
    const data = {};
    if (heroHeadline !== undefined) data.heroHeadline = heroHeadline;
    if (heroSub !== undefined) data.heroSub = heroSub;
    if (ctaText !== undefined) data.ctaText = ctaText;
    if (tagline !== undefined) data.tagline = tagline;
    if (serviceArea !== undefined) data.serviceArea = serviceArea;

    let config = await prisma.siteConfig.upsert({
      where: { tenantId: 'aevum-roofing' },
      update: data,
      create: { tenantId: 'aevum-roofing', ...data },
    });

    writeHTML(generateHTML(config));
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

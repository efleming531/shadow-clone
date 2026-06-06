const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();
const STATIC_PATH = path.join(__dirname, '../../static/aevum/index.html');

async function getOrCreateConfig() {
  let config = await prisma.siteConfig.findUnique({ where: { tenantId: 'aevum-roofing' } });
  if (!config) {
    config = await prisma.siteConfig.create({ data: { tenantId: 'aevum-roofing' } });
    fs.writeFileSync(STATIC_PATH, generateHTML(config), 'utf8');
  }
  return config;
}

function generateHTML(config) {
  const { heroHeadline, heroSub, ctaText, tagline, serviceArea } = config;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AEVUM — ${tagline}</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital@0,1&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:#E8E4DC;color:#0D0D0D;font-family:'Courier Prime',monospace;cursor:crosshair;overflow-x:hidden}
a{color:inherit;text-decoration:none}
.display{font-family:'Bebas Neue',sans-serif;letter-spacing:0.05em}
.serif-italic{font-family:'EB Garamond',serif;font-style:italic}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 48px;border-bottom:2px solid #0D0D0D;background:#E8E4DC}
.nav-mark{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:0.2em}
.nav-cta{font-family:'Courier Prime',monospace;font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;border:2px solid #0D0D0D;padding:10px 20px;background:transparent;cursor:crosshair;transition:all 0.15s}
.nav-cta:hover{background:#0D0D0D;color:#E8E4DC}

/* HERO */
.hero{min-height:100vh;padding-top:80px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;background-color:#E8E4DC}
.hero-grid{position:absolute;inset:0;background-image:linear-gradient(#0D0D0D1a 1px,transparent 1px),linear-gradient(90deg,#0D0D0D1a 1px,transparent 1px);background-size:60px 60px;pointer-events:none}
.hero-inner{position:relative;padding:80px 48px;max-width:1400px;margin:0 auto;width:100%}
.hero-headline{font-family:'Bebas Neue',sans-serif;font-size:clamp(4rem,10vw,9rem);line-height:0.92;letter-spacing:0.02em;color:#0D0D0D;max-width:900px}
.hero-sub{font-family:'EB Garamond',serif;font-style:italic;font-size:clamp(1.1rem,2vw,1.5rem);color:#3A3A3A;max-width:600px;margin-top:32px;line-height:1.5}
.hero-cta{display:inline-block;margin-top:48px;font-family:'Courier Prime',monospace;font-size:0.85rem;letter-spacing:0.2em;text-transform:uppercase;border:2px solid #0D0D0D;padding:16px 40px;background:#0D0D0D;color:#E8E4DC;transition:all 0.15s}
.hero-cta:hover{background:#E8E4DC;color:#0D0D0D}
.hero-tag{position:absolute;bottom:48px;right:48px;font-family:'Courier Prime',monospace;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#6A6A6A;writing-mode:vertical-rl}

/* TICKER */
.ticker{background:#0D0D0D;color:#E8E4DC;padding:14px 0;overflow:hidden;border-top:2px solid #0D0D0D;border-bottom:2px solid #0D0D0D}
.ticker-inner{display:flex;gap:64px;white-space:nowrap;animation:ticker 30s linear infinite}
.ticker-inner span{font-family:'Courier Prime',monospace;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;flex-shrink:0}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* THE STANDARD */
.standard{background:#0D0D0D;color:#E8E4DC;padding:120px 48px}
.standard-header{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,5vw,4rem);letter-spacing:0.1em;margin-bottom:80px;border-bottom:2px solid #E8E4DC44;padding-bottom:32px}
.standard-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;border:2px solid #E8E4DC22}
.standard-col{padding:48px 40px;border-right:2px solid #E8E4DC22}
.standard-col:last-child{border-right:none}
.standard-num{font-family:'Bebas Neue',sans-serif;font-size:3.5rem;color:#6A6A6A;line-height:1}
.standard-title{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:0.08em;margin-top:16px;color:#E8E4DC}
.standard-body{font-family:'Courier Prime',monospace;font-size:0.8rem;line-height:1.7;color:#9A9A9A;margin-top:16px}

/* MATERIALS */
.materials{background:#E8E4DC;padding:120px 48px}
.materials-header{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,5vw,4rem);letter-spacing:0.1em;margin-bottom:16px}
.materials-sub{font-family:'Courier Prime',monospace;font-size:0.8rem;letter-spacing:0.15em;text-transform:uppercase;color:#6A6A6A;margin-bottom:64px}
.materials-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.mat-card{border:2px solid #0D0D0D;padding:48px 32px;background:#E8E4DC;transition:all 0.2s;position:relative;overflow:hidden}
.mat-card:hover{background:#0D0D0D;color:#E8E4DC}
.mat-card-mark{font-family:'Bebas Neue',sans-serif;font-size:0.85rem;letter-spacing:0.2em;color:#6A6A6A;margin-bottom:16px}
.mat-card:hover .mat-card-mark{color:#9A9A9A}
.mat-card-name{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:0.06em;line-height:1}
.mat-card-desc{font-family:'Courier Prime',monospace;font-size:0.75rem;line-height:1.6;color:#6A6A6A;margin-top:16px}
.mat-card:hover .mat-card-desc{color:#9A9A9A}

/* PROCESS */
.process{background:#D0CCB8;padding:120px 48px;border-top:2px solid #0D0D0D;border-bottom:2px solid #0D0D0D}
.process-header{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,5vw,4rem);letter-spacing:0.1em;margin-bottom:80px}
.process-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.process-step{padding:40px 32px;border-right:2px solid #0D0D0D}
.process-step:last-child{border-right:none}
.process-step-num{font-family:'Bebas Neue',sans-serif;font-size:4rem;color:#C8C4BC;line-height:1}
.process-step-title{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:0.08em;margin-top:8px}
.process-step-body{font-family:'Courier Prime',monospace;font-size:0.78rem;line-height:1.7;color:#5A5A5A;margin-top:12px}

/* CTA SECTION */
.cta-section{background:#0D0D0D;padding:120px 48px;text-align:center;border-top:2px solid #E8E4DC22}
.cta-headline{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,7vw,6rem);color:#E8E4DC;letter-spacing:0.05em;margin-bottom:48px}
.cta-btn{display:inline-block;font-family:'Courier Prime',monospace;font-size:0.9rem;letter-spacing:0.2em;text-transform:uppercase;border:2px solid #E8E4DC;padding:20px 56px;color:#E8E4DC;transition:all 0.15s}
.cta-btn:hover{background:#E8E4DC;color:#0D0D0D}

/* FOOTER */
footer{background:#0D0D0D;color:#E8E4DC;padding:48px;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #E8E4DC22}
.footer-mark{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:0.2em}
.footer-area{font-family:'Courier Prime',monospace;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#6A6A6A}
.footer-right{font-family:'Courier Prime',monospace;font-size:0.7rem;color:#6A6A6A;letter-spacing:0.1em}

@media(hover:none){body,button,a{cursor:auto}}

@media(max-width:640px){
  nav{padding:12px 20px}
  .nav-cta{font-size:0.65rem;padding:8px 14px;letter-spacing:0.08em}
  .hero-inner{padding:56px 20px 40px}
  .hero-sub{margin-top:20px;font-size:1rem}
  .hero-cta{margin-top:32px;padding:14px 28px;font-size:0.75rem;letter-spacing:0.15em}
  .hero-tag{display:none}
  .standard{padding:72px 20px}
  .standard-header{margin-bottom:40px}
  .standard-grid{grid-template-columns:1fr;border:none;gap:0}
  .standard-col{padding:32px 20px;border-right:none;border-bottom:2px solid #E8E4DC22}
  .standard-col:last-child{border-bottom:none}
  .materials{padding:72px 20px}
  .materials-sub{margin-bottom:32px}
  .materials-grid{grid-template-columns:1fr}
  .mat-card{padding:32px 20px}
  .process{padding:72px 20px}
  .process-header{margin-bottom:40px}
  .process-steps{grid-template-columns:1fr}
  .process-step{border-right:none;border-bottom:2px solid #0D0D0D;padding:28px 20px}
  .process-step:last-child{border-bottom:none}
  .cta-section{padding:72px 20px}
  .cta-headline{margin-bottom:32px}
  .cta-btn{padding:14px 32px;font-size:0.8rem;letter-spacing:0.15em}
  footer{padding:32px 20px;flex-direction:column;gap:20px;align-items:flex-start}
}

@media(min-width:641px) and (max-width:1024px){
  nav{padding:14px 32px}
  .hero-inner{padding:72px 32px}
  .hero-tag{bottom:32px;right:32px}
  .standard{padding:96px 32px}
  .standard-header{margin-bottom:56px}
  .standard-grid{grid-template-columns:1fr;border:none;gap:0}
  .standard-col{border-right:none;border-bottom:2px solid #E8E4DC22;padding:40px 32px}
  .standard-col:last-child{border-bottom:none}
  .materials{padding:96px 32px}
  .materials-grid{grid-template-columns:repeat(2,1fr)}
  .process{padding:96px 32px}
  .process-header{margin-bottom:56px}
  .process-steps{grid-template-columns:repeat(2,1fr)}
  .process-step:last-child{border-right:2px solid #0D0D0D}
  .process-step:nth-child(even){border-right:none}
  .process-step:nth-child(1),.process-step:nth-child(2){border-bottom:2px solid #0D0D0D}
  .cta-section{padding:96px 32px}
  footer{padding:40px 32px}
}
</style>
</head>
<body>

<nav>
  <div class="nav-mark">// AEVUM</div>
  <a href="/site/aevum/assessment" class="nav-cta">Request Assessment</a>
</nav>

<section class="hero">
  <div class="hero-grid"></div>
  <div class="hero-inner">
    <h1 class="hero-headline">${heroHeadline}</h1>
    <p class="hero-sub">${heroSub}</p>
    <a href="/site/aevum/assessment" class="hero-cta">${ctaText}</a>
  </div>
  <div class="hero-tag">${tagline}</div>
</section>

<div class="ticker">
  <div class="ticker-inner">
    <span>// GAF Master Elite</span>
    <span>// Natural Slate</span>
    <span>// Standing Seam Metal</span>
    <span>// DaVinci Composite</span>
    <span>// Cedar Shake</span>
    <span>// Clay Tile</span>
    <span>// CertainTeed Select ShingleMaster</span>
    <span>// Owens Corning Platinum</span>
    <span>// NRCA Member</span>
    <span>// GAF Master Elite</span>
    <span>// Natural Slate</span>
    <span>// Standing Seam Metal</span>
    <span>// DaVinci Composite</span>
    <span>// Cedar Shake</span>
    <span>// Clay Tile</span>
    <span>// CertainTeed Select ShingleMaster</span>
    <span>// Owens Corning Platinum</span>
    <span>// NRCA Member</span>
  </div>
</div>

<section class="standard">
  <h2 class="standard-header">// The Standard</h2>
  <div class="standard-grid">
    <div class="standard-col">
      <div class="standard-num">01</div>
      <div class="standard-title">Building Envelope Expertise</div>
      <p class="standard-body">Every roof is a system — not a surface. We engineer complete building envelopes that manage moisture, thermal performance, and structural load as an integrated whole.</p>
    </div>
    <div class="standard-col">
      <div class="standard-num">02</div>
      <div class="standard-title">White-Glove Project Management</div>
      <p class="standard-body">A dedicated project lead from assessment through certification. You have one contact, complete transparency, and a schedule that respects your life — not ours.</p>
    </div>
    <div class="standard-col">
      <div class="standard-num">03</div>
      <div class="standard-title">Specialty Material Access</div>
      <p class="standard-body">Direct relationships with slate quarries, copper fabricators, and specialty metal suppliers. We source materials unavailable to general contractors — for clients who demand permanence.</p>
    </div>
  </div>
</section>

<section class="materials">
  <h2 class="materials-header">// Materials</h2>
  <p class="materials-sub">Selected for longevity. Installed for legacy.</p>
  <div class="materials-grid">
    <div class="mat-card">
      <div class="mat-card-mark">// 01</div>
      <div class="mat-card-name">Natural Slate</div>
      <p class="mat-card-desc">150+ year lifespan. Quarried in Vermont and Spain. The original permanent roof.</p>
    </div>
    <div class="mat-card">
      <div class="mat-card-mark">// 02</div>
      <div class="mat-card-name">Clay Tile</div>
      <p class="mat-card-desc">Fire-resistant, thermally inert, structurally proven across centuries and continents.</p>
    </div>
    <div class="mat-card">
      <div class="mat-card-mark">// 03</div>
      <div class="mat-card-name">Standing Seam Metal</div>
      <p class="mat-card-desc">Concealed fastener systems with 70+ year performance warranties. Zero penetrations.</p>
    </div>
    <div class="mat-card">
      <div class="mat-card-mark">// 04</div>
      <div class="mat-card-name">DaVinci Composite</div>
      <p class="mat-card-desc">Class 4 impact rating. Designed to replicate slate and shake at half the structural load.</p>
    </div>
    <div class="mat-card">
      <div class="mat-card-mark">// 05</div>
      <div class="mat-card-name">GAF Timberline</div>
      <p class="mat-card-desc">The benchmark architectural shingle. Installed by GAF Master Elite contractors only.</p>
    </div>
    <div class="mat-card">
      <div class="mat-card-mark">// 06</div>
      <div class="mat-card-name">Cedar Shake</div>
      <p class="mat-card-desc">Hand-split western red cedar. Naturally insulating, naturally beautiful, naturally distinctive.</p>
    </div>
  </div>
</section>

<section class="process">
  <h2 class="process-header">// Our Process</h2>
  <div class="process-steps">
    <div class="process-step">
      <div class="process-step-num">01</div>
      <div class="process-step-title">Assessment</div>
      <p class="process-step-body">Full building envelope inspection. Drone imaging, moisture mapping, and structural evaluation — documented in a written report you keep.</p>
    </div>
    <div class="process-step">
      <div class="process-step-num">02</div>
      <div class="process-step-title">Design</div>
      <p class="process-step-body">Material selection, system specification, and detailed scope — reviewed with you before a single fastener is ordered.</p>
    </div>
    <div class="process-step">
      <div class="process-step-num">03</div>
      <div class="process-step-title">Installation</div>
      <p class="process-step-body">Our crew. No subcontractors. Every installer is Aevum-trained and manufacturer-certified for the specific system being installed.</p>
    </div>
    <div class="process-step">
      <div class="process-step-num">04</div>
      <div class="process-step-title">Certification</div>
      <p class="process-step-body">Manufacturer warranty registration, final inspection report, and a complete project file — delivered before final payment is requested.</p>
    </div>
  </div>
</section>

<section class="cta-section">
  <h2 class="cta-headline">Your Home Deserves a Permanent Roof.</h2>
  <a href="/site/aevum/assessment" class="cta-btn">${ctaText}</a>
</section>

<footer>
  <div>
    <div class="footer-mark">// AEVUM</div>
    <div class="footer-area">${serviceArea}</div>
  </div>
  <div class="footer-right">© ${new Date().getFullYear()} Aevum Roofing. All rights reserved.</div>
</footer>

</body>
</html>`;
}

// GET /aevum — serves HTML (under /site) or JSON config (under /api/sites)
router.get('/aevum', async (req, res) => {
  try {
    if (req.baseUrl === '/site') {
      if (!fs.existsSync(STATIC_PATH)) {
        const config = await getOrCreateConfig();
        fs.writeFileSync(STATIC_PATH, generateHTML(config), 'utf8');
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

    const html = generateHTML(config);
    fs.writeFileSync(STATIC_PATH, html, 'utf8');
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

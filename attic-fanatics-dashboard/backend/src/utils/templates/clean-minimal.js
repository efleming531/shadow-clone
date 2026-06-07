module.exports = function generateHTML(config) {
  const {
    heroHeadline = 'READY TO BUILD SOMETHING EXCEPTIONAL?',
    heroSub = "We don't do standard jobs — we build building envelopes that outlast the generation that commissioned them.",
    ctaText = 'Request a Project Assessment',
    tagline = 'Built to Last an Era',
    serviceArea = 'NJ · NY · PA',
    slug = 'aevum',
  } = config;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AEVUM — ${tagline}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white: #FFFFFF;
    --off-white: #F9F9F9;
    --gray-50: #F5F5F5;
    --gray-100: #EBEBEB;
    --gray-300: #C7C7C7;
    --gray-500: #787878;
    --gray-700: #424242;
    --black: #111111;
    --blue: #2563EB;
    --blue-hover: #1D4ED8;
    --radius: 8px;
    --shadow: 0 1px 4px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.06);
    --font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  html { scroll-behavior: smooth; }
  body { background: var(--off-white); color: var(--black); font-family: var(--font); }

  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 2rem;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--gray-100);
  }

  .nav-logo { font-weight: 700; font-size: 1.1rem; color: var(--black); text-decoration: none; letter-spacing: -0.02em; }
  .nav-logo span { color: var(--blue); }

  .nav-links { display: flex; gap: 2rem; list-style: none; }
  .nav-links a { font-size: 0.875rem; color: var(--gray-700); text-decoration: none; transition: color 0.15s; }
  .nav-links a:hover { color: var(--blue); }

  .nav-cta {
    background: var(--blue); color: white; padding: 0.6rem 1.25rem; border-radius: var(--radius);
    font-size: 0.875rem; font-weight: 600; text-decoration: none; transition: background 0.15s;
  }
  .nav-cta:hover { background: var(--blue-hover); }

  #hero {
    min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
    padding: 8rem 2rem 4rem; background: white;
    border-bottom: 1px solid var(--gray-100);
  }

  .hero-inner { max-width: 720px; }

  .hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: #EFF6FF; color: var(--blue); padding: 0.3rem 0.75rem;
    border-radius: 100px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase; margin-bottom: 2rem;
  }

  .hero-badge::before { content: ''; width: 6px; height: 6px; background: var(--blue); border-radius: 50%; }

  h1 {
    font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; letter-spacing: -0.04em;
    line-height: 1.05; color: var(--black); margin-bottom: 1.5rem;
  }

  h1 span { color: var(--blue); }

  .hero-sub {
    font-size: clamp(1rem, 2vw, 1.2rem); color: var(--gray-700); line-height: 1.7;
    max-width: 540px; margin-bottom: 2.5rem;
  }

  .hero-actions { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }

  .btn-primary {
    background: var(--blue); color: white; padding: 0.9rem 2rem; border-radius: var(--radius);
    font-size: 1rem; font-weight: 600; text-decoration: none; transition: background 0.15s;
    box-shadow: 0 2px 8px rgba(37,99,235,0.3);
  }
  .btn-primary:hover { background: var(--blue-hover); }

  .btn-secondary {
    color: var(--gray-700); font-size: 0.9rem; text-decoration: none;
    display: flex; align-items: center; gap: 0.4rem; transition: color 0.15s;
  }
  .btn-secondary:hover { color: var(--blue); }

  .hero-stats {
    display: flex; gap: 2.5rem; margin-top: 3.5rem; padding-top: 3rem;
    border-top: 1px solid var(--gray-100); flex-wrap: wrap;
  }

  .stat strong { display: block; font-size: 1.6rem; font-weight: 800; color: var(--black); letter-spacing: -0.03em; }
  .stat span { font-size: 0.8rem; color: var(--gray-500); margin-top: 0.2rem; display: block; }

  section { padding: 6rem 2rem; }
  .section-inner { max-width: 1100px; margin: 0 auto; }

  .section-tag {
    display: inline-block; background: var(--gray-50); color: var(--gray-500);
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 0.3rem 0.75rem; border-radius: 4px; margin-bottom: 1.2rem;
  }

  h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1rem; }
  h2 span { color: var(--blue); }

  .subtitle { font-size: 1.05rem; color: var(--gray-500); line-height: 1.7; max-width: 520px; margin-bottom: 3rem; }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .card {
    background: white; border-radius: 12px; padding: 2rem;
    box-shadow: var(--shadow); border: 1px solid var(--gray-100);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .card:hover { transform: translateY(-2px); box-shadow: 0 4px 24px rgba(0,0,0,0.1); }

  .card-icon {
    width: 44px; height: 44px; background: #EFF6FF; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem; margin-bottom: 1rem;
  }

  .card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.6rem; }
  .card p { font-size: 0.875rem; color: var(--gray-500); line-height: 1.7; }

  #materials { background: var(--gray-50); }

  .materials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

  .material-pill {
    background: white; border: 1px solid var(--gray-100); border-radius: var(--radius);
    padding: 1.25rem 1rem; text-align: center;
    box-shadow: var(--shadow);
    transition: border-color 0.15s;
  }
  .material-pill:hover { border-color: var(--blue); }
  .material-pill strong { display: block; font-size: 0.9rem; font-weight: 700; margin-bottom: 0.3rem; }
  .material-pill span { font-size: 0.75rem; color: var(--gray-500); }

  #process { background: white; }

  .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0; }

  .step { padding: 2rem; position: relative; }
  .step + .step::before {
    content: ''; position: absolute; left: 0; top: 2.5rem;
    width: 1px; height: 3rem; background: var(--gray-100);
  }

  .step-num {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--blue); margin-bottom: 0.75rem;
  }

  .step h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.6rem; }
  .step p { font-size: 0.85rem; color: var(--gray-500); line-height: 1.7; }

  #cta { background: var(--blue); color: white; text-align: center; }
  #cta h2 { color: white; }
  #cta .subtitle { color: rgba(255,255,255,0.75); max-width: 480px; margin: 0 auto 2.5rem; }
  #cta .btn-white {
    background: white; color: var(--blue); padding: 1rem 2.5rem; border-radius: var(--radius);
    font-size: 1rem; font-weight: 700; text-decoration: none; display: inline-block;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
  #cta .btn-white:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.2); }
  #cta .cta-note { margin-top: 1.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.5); }

  footer {
    background: var(--black); color: white; padding: 2.5rem 2rem;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
  }
  .footer-brand { font-weight: 700; font-size: 1rem; }
  .footer-brand span { color: var(--blue); }
  .footer-meta { font-size: 0.75rem; color: var(--gray-500); text-align: right; line-height: 1.8; }

  @media (max-width: 768px) {
    nav { padding: 0.9rem 1.2rem; }
    .nav-links { display: none; }
    section { padding: 4rem 1.2rem; }
    #hero { padding: 7rem 1.2rem 3rem; }
    footer { padding: 1.5rem 1.2rem; }
    .footer-meta { text-align: left; }
  }
</style>
</head>
<body>

<nav>
  <a href="/login" class="nav-logo">AEVUM<span>.</span></a>
  <ul class="nav-links">
    <li><a href="#standard">Why Aevum</a></li>
    <li><a href="#materials">Materials</a></li>
    <li><a href="#process">Process</a></li>
  </ul>
  <a href="/site/${slug}/assessment" class="nav-cta">${ctaText}</a>
</nav>

<section id="hero">
  <div class="hero-inner">
    <div class="hero-badge">Premium Residential Roofing</div>
    <h1>Roofing Built for<br><span>Exceptional Homes.</span></h1>
    <p class="hero-sub">${heroSub}</p>
    <div class="hero-actions">
      <a href="/site/${slug}/assessment" class="btn-primary">${ctaText}</a>
      <a href="#process" class="btn-secondary">See our process →</a>
    </div>
    <div class="hero-stats">
      <div class="stat"><strong>$10K+</strong><span>Minimum project</span></div>
      <div class="stat"><strong>${serviceArea}</strong><span>Service area</span></div>
      <div class="stat"><strong>GAF Elite</strong><span>Master certified</span></div>
    </div>
  </div>
</section>

<section id="standard">
  <div class="section-inner">
    <div class="section-tag">The Aevum Standard</div>
    <h2>Not a roofing<br>company. <span>A standard.</span></h2>
    <p class="subtitle">We treat every roof as an architectural element — not a commodity replacement.</p>
    <div class="cards-grid">
      <div class="card">
        <div class="card-icon">◈</div>
        <h3>Building Envelope Expertise</h3>
        <p>Material selection, drainage engineering, and thermal performance — specified for each home, not templated from a catalog.</p>
      </div>
      <div class="card">
        <div class="card-icon">◉</div>
        <h3>White-Glove Management</h3>
        <p>A dedicated project lead from assessment to final certification. Direct line, vetted crews, no surprises.</p>
      </div>
      <div class="card">
        <div class="card-icon">▲</div>
        <h3>Specialty Material Access</h3>
        <p>Ludowici clay tile, DaVinci composite slate, standing seam copper — material lines most contractors can't access.</p>
      </div>
    </div>
  </div>
</section>

<section id="materials">
  <div class="section-inner">
    <div class="section-tag">Material Systems</div>
    <h2>What we<br><span>work with.</span></h2>
    <p class="subtitle">Premium material lines for premium homes.</p>
    <div class="materials-grid">
      <div class="material-pill"><strong>Natural Slate</strong><span>150+ year lifespan</span></div>
      <div class="material-pill"><strong>Clay &amp; Terracotta</strong><span>Ludowici · Old World</span></div>
      <div class="material-pill"><strong>Standing Seam Metal</strong><span>Copper · Zinc · Steel</span></div>
      <div class="material-pill"><strong>DaVinci Composite</strong><span>Engineered slate &amp; shake</span></div>
      <div class="material-pill"><strong>GAF Timberline</strong><span>Master Elite · Lifetime</span></div>
      <div class="material-pill"><strong>Cedar Shake</strong><span>Old-growth · Hand-split</span></div>
    </div>
  </div>
</section>

<section id="process">
  <div class="section-inner">
    <div class="section-tag">How It Works</div>
    <h2>The Aevum<br><span>process.</span></h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">01 — Assessment</div>
        <h3>Project Assessment</h3>
        <p>A senior specialist evaluates your property — structure, drainage, material fit, and long-term performance.</p>
      </div>
      <div class="step">
        <div class="step-num">02 — Design</div>
        <h3>Design &amp; Specification</h3>
        <p>Full material specification, reviewed line by line with your project lead. No surprises, no change-order games.</p>
      </div>
      <div class="step">
        <div class="step-num">03 — Build</div>
        <h3>Installation</h3>
        <p>Vetted crews execute to manufacturer spec. Your property stays protected every day we're on site.</p>
      </div>
      <div class="step">
        <div class="step-num">04 — Certify</div>
        <h3>Certification &amp; Warranty</h3>
        <p>Post-install inspection, manufacturer certification, and your Aevum workmanship guarantee. Full documentation delivered.</p>
      </div>
    </div>
  </div>
</section>

<section id="cta">
  <div class="section-inner">
    <div class="section-tag" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);">Start Here</div>
    <h2>${heroHeadline}</h2>
    <p class="subtitle">We evaluate every project before accepting it. If it's the right fit, a specialist reaches out within one business day.</p>
    <a href="/site/${slug}/assessment" class="btn-white">${ctaText}</a>
    <p class="cta-note">$10,000 minimum · ${serviceArea} · Expanding nationally</p>
  </div>
</section>

<footer>
  <div class="footer-brand">AEVUM<span>.</span></div>
  <div class="footer-meta">
    ${tagline}<br>
    ${serviceArea}<br>
    &copy; ${new Date().getFullYear()} Aevum Roofing. All Rights Reserved.
  </div>
</footer>

</body>
</html>`;
};

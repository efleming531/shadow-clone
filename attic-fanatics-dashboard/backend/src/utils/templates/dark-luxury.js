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
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black: #050505;
    --black-2: #0C0C0C;
    --black-3: #141414;
    --rule: #1C1C1C;
    --gold: #C9A84C;
    --gold-light: #DFC070;
    --cream: #F5F0E8;
    --muted: #5A5A5A;
    --cormorant: 'Cormorant Garamond', Georgia, serif;
    --sans: 'Montserrat', system-ui, sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--black);
    color: var(--cream);
    font-family: var(--cormorant);
    overflow-x: hidden;
  }

  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.5rem 3rem;
    background: rgba(5,5,5,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--rule);
  }

  .nav-logo {
    font-family: var(--sans); font-size: 0.75rem; font-weight: 300;
    letter-spacing: 0.5em; text-transform: uppercase; color: var(--cream);
    text-decoration: none;
  }

  .nav-logo strong { color: var(--gold); font-weight: 600; }

  .nav-links { display: flex; gap: 3rem; list-style: none; }
  .nav-links a {
    font-family: var(--sans); font-size: 0.65rem; letter-spacing: 0.25em;
    text-transform: uppercase; color: var(--muted); text-decoration: none;
    transition: color 0.3s;
  }
  .nav-links a:hover { color: var(--gold); }

  .nav-cta {
    font-family: var(--sans); font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--black); background: var(--gold); padding: 0.65rem 1.5rem;
    text-decoration: none; transition: background 0.3s;
  }
  .nav-cta:hover { background: var(--gold-light); }

  #hero {
    min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
    padding: 8rem 3rem 6rem; position: relative; overflow: hidden;
    border-bottom: 1px solid var(--rule);
  }

  .hero-orb {
    position: absolute; top: 20%; right: 5%;
    width: 40vw; height: 40vw; max-width: 500px; max-height: 500px;
    background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none; border-radius: 50%;
  }

  .hero-inner { max-width: 800px; position: relative; z-index: 2; }

  .hero-rule {
    width: 60px; height: 1px; background: var(--gold); margin-bottom: 2.5rem;
  }

  .hero-eyebrow {
    font-family: var(--sans); font-size: 0.65rem; font-weight: 300;
    letter-spacing: 0.4em; text-transform: uppercase; color: var(--gold);
    margin-bottom: 2rem;
  }

  h1 {
    font-family: var(--cormorant); font-size: clamp(4rem, 10vw, 9rem);
    font-weight: 300; line-height: 0.92; letter-spacing: -0.01em;
    color: var(--cream); margin-bottom: 2rem;
  }

  h1 em { font-style: italic; color: var(--gold); }

  .hero-sub {
    font-family: var(--cormorant); font-size: clamp(1.1rem, 2vw, 1.4rem);
    font-style: italic; color: var(--muted); max-width: 500px;
    line-height: 1.7; margin-bottom: 3.5rem;
    border-left: 1px solid var(--gold); padding-left: 1.5rem;
  }

  .hero-actions { display: flex; gap: 2rem; align-items: center; flex-wrap: wrap; }

  .btn-gold {
    font-family: var(--sans); font-size: 0.7rem; letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--black); background: var(--gold); padding: 1rem 2.5rem;
    text-decoration: none; transition: background 0.3s;
  }
  .btn-gold:hover { background: var(--gold-light); }

  .btn-outline {
    font-family: var(--sans); font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--muted); border-bottom: 1px solid var(--rule); padding-bottom: 0.15rem;
    text-decoration: none; transition: color 0.3s, border-color 0.3s;
  }
  .btn-outline:hover { color: var(--gold); border-color: var(--gold); }

  .hero-stats {
    display: flex; gap: 4rem; margin-top: 5rem; padding-top: 3rem;
    border-top: 1px solid var(--rule); flex-wrap: wrap;
  }

  .stat strong {
    display: block; font-family: var(--cormorant); font-size: 2.2rem;
    font-weight: 300; color: var(--gold); line-height: 1; margin-bottom: 0.3rem;
  }
  .stat span {
    font-family: var(--sans); font-size: 0.6rem; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--muted);
  }

  section {
    padding: 8rem 3rem;
    border-bottom: 1px solid var(--rule);
  }

  .section-inner { max-width: 1100px; margin: 0 auto; }

  .section-label {
    font-family: var(--sans); font-size: 0.6rem; letter-spacing: 0.4em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 1.5rem;
    display: flex; align-items: center; gap: 1.5rem;
  }

  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--rule); max-width: 60px; }

  h2 {
    font-family: var(--cormorant); font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 300; line-height: 1.05; color: var(--cream); margin-bottom: 1.5rem;
  }

  h2 em { font-style: italic; color: var(--gold); }

  .lead { font-size: 1.1rem; font-style: italic; color: var(--muted); max-width: 500px; line-height: 1.7; margin-bottom: 4rem; }

  #standard { background: var(--black-2); }

  .pillars { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0; border: 1px solid var(--rule); }

  .pillar { padding: 3rem 2.5rem; border-right: 1px solid var(--rule); }
  .pillar:last-child { border-right: none; }

  .pillar-num {
    font-family: var(--cormorant); font-size: 4rem; font-weight: 300;
    color: var(--rule); line-height: 1; margin-bottom: 1.5rem;
  }

  .pillar h3 {
    font-family: var(--cormorant); font-size: 1.4rem; font-weight: 400;
    color: var(--cream); margin-bottom: 0.8rem; letter-spacing: 0.02em;
  }

  .pillar p {
    font-family: var(--cormorant); font-size: 0.95rem; font-style: italic;
    color: var(--muted); line-height: 1.8;
  }

  #materials { background: var(--black-3); }

  .materials-luxury {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0;
    border: 1px solid var(--rule); margin-top: 3rem;
  }

  .mat-lux {
    padding: 2rem 1.5rem; border-right: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
    transition: background 0.4s;
  }

  .mat-lux:hover { background: var(--black-2); }

  .mat-lux-name {
    font-family: var(--cormorant); font-size: 1.1rem; color: var(--cream); margin-bottom: 0.4rem;
  }

  .mat-lux-sub {
    font-family: var(--sans); font-size: 0.6rem; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--muted);
  }

  .mat-lux-accent { width: 20px; height: 1px; background: var(--gold); margin-bottom: 1rem; }

  #process { background: var(--black); }

  .process-luxury {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0; border: 1px solid var(--rule); margin-top: 3rem;
  }

  .step-lux { padding: 3rem 2rem; border-right: 1px solid var(--rule); position: relative; }
  .step-lux:last-child { border-right: none; }

  .step-lux-num {
    font-family: var(--cormorant); font-size: 5rem; font-weight: 300;
    color: var(--rule); line-height: 1; margin-bottom: 1rem;
  }

  .step-lux h3 {
    font-family: var(--cormorant); font-size: 1.2rem; color: var(--gold); margin-bottom: 0.8rem;
  }

  .step-lux p {
    font-family: var(--cormorant); font-size: 0.9rem; font-style: italic;
    color: var(--muted); line-height: 1.8;
  }

  #cta { background: var(--black-2); text-align: center; }
  #cta h2 { margin-bottom: 1rem; }
  #cta .lead { max-width: 460px; margin: 0 auto 2.5rem; }
  #cta .cta-note {
    margin-top: 1.5rem; font-family: var(--sans); font-size: 0.6rem;
    letter-spacing: 0.2em; color: var(--muted); text-transform: uppercase;
  }

  footer {
    background: var(--black); padding: 3rem;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 1rem; border-top: 1px solid var(--rule);
  }

  .footer-brand {
    font-family: var(--sans); font-size: 0.7rem; font-weight: 300;
    letter-spacing: 0.4em; text-transform: uppercase; color: var(--cream);
  }

  .footer-brand strong { color: var(--gold); }

  .footer-meta {
    font-family: var(--sans); font-size: 0.6rem; letter-spacing: 0.1em;
    color: var(--muted); text-align: right; line-height: 2;
  }

  @media (max-width: 768px) {
    nav { padding: 1rem 1.5rem; }
    .nav-links { display: none; }
    section { padding: 5rem 1.5rem; }
    #hero { padding: 8rem 1.5rem 4rem; }
    footer { padding: 2rem 1.5rem; }
    .footer-meta { text-align: left; }
  }
</style>
</head>
<body>

<nav>
  <a href="/login" class="nav-logo">AEVUM &nbsp;<strong>ROOFING</strong></a>
  <ul class="nav-links">
    <li><a href="#standard">The Standard</a></li>
    <li><a href="#materials">Materials</a></li>
    <li><a href="#process">Process</a></li>
  </ul>
  <a href="/site/${slug}/assessment" class="nav-cta">${ctaText}</a>
</nav>

<section id="hero">
  <div class="hero-orb"></div>
  <div class="hero-inner">
    <div class="hero-rule"></div>
    <div class="hero-eyebrow">Premium Residential Roofing · ${serviceArea}</div>
    <h1>Built to Last<br><em>an Era.</em></h1>
    <p class="hero-sub">${heroSub}</p>
    <div class="hero-actions">
      <a href="/site/${slug}/assessment" class="btn-gold">${ctaText}</a>
      <a href="#process" class="btn-outline">Our process</a>
    </div>
    <div class="hero-stats">
      <div class="stat"><strong>$10K+</strong><span>Minimum Project</span></div>
      <div class="stat"><strong>${serviceArea}</strong><span>Primary Corridor</span></div>
      <div class="stat"><strong>GAF Elite</strong><span>Certified</span></div>
    </div>
  </div>
</section>

<section id="standard">
  <div class="section-inner">
    <div class="section-label">The Aevum Standard</div>
    <h2>Not a contractor.<br><em>An atelier.</em></h2>
    <p class="lead">Every project is an architectural commission — treated as such from the first site visit to final certification.</p>
    <div class="pillars">
      <div class="pillar">
        <div class="pillar-num">I</div>
        <h3>Building Envelope Expertise</h3>
        <p>Material selection, drainage engineering, and thermal performance are specified for each home — not templated from a catalog.</p>
      </div>
      <div class="pillar">
        <div class="pillar-num">II</div>
        <h3>White-Glove Management</h3>
        <p>A dedicated project lead manages your job from assessment through final certification — direct line, vetted crews.</p>
      </div>
      <div class="pillar">
        <div class="pillar-num">III</div>
        <h3>Specialty Material Access</h3>
        <p>Ludowici clay tile, DaVinci composite slate, standing seam copper — material lines most contractors cannot access.</p>
      </div>
    </div>
  </div>
</section>

<section id="materials">
  <div class="section-inner">
    <div class="section-label">Material Systems</div>
    <h2>What we<br><em>work with.</em></h2>
    <div class="materials-luxury">
      <div class="mat-lux"><div class="mat-lux-accent"></div><div class="mat-lux-name">Natural Slate</div><div class="mat-lux-sub">150+ year lifespan</div></div>
      <div class="mat-lux"><div class="mat-lux-accent"></div><div class="mat-lux-name">Clay &amp; Terracotta</div><div class="mat-lux-sub">Ludowici · Old World</div></div>
      <div class="mat-lux"><div class="mat-lux-accent"></div><div class="mat-lux-name">Standing Seam Metal</div><div class="mat-lux-sub">Copper · Zinc · Steel</div></div>
      <div class="mat-lux"><div class="mat-lux-accent"></div><div class="mat-lux-name">DaVinci Composite</div><div class="mat-lux-sub">Engineered slate &amp; shake</div></div>
      <div class="mat-lux"><div class="mat-lux-accent"></div><div class="mat-lux-name">GAF Timberline</div><div class="mat-lux-sub">Master Elite · Lifetime</div></div>
      <div class="mat-lux"><div class="mat-lux-accent"></div><div class="mat-lux-name">Cedar Shake</div><div class="mat-lux-sub">Old-growth · Hand-split</div></div>
    </div>
  </div>
</section>

<section id="process">
  <div class="section-inner">
    <div class="section-label">How It Works</div>
    <h2>The Aevum<br><em>process.</em></h2>
    <div class="process-luxury">
      <div class="step-lux">
        <div class="step-lux-num">01</div>
        <h3>Project Assessment</h3>
        <p>A senior Aevum specialist visits the property. Structure, drainage, material fit, and long-term performance — assessed in full.</p>
      </div>
      <div class="step-lux">
        <div class="step-lux-num">02</div>
        <h3>Design &amp; Specification</h3>
        <p>A full material specification, reviewed line by line. No surprises, no change-order games — ever.</p>
      </div>
      <div class="step-lux">
        <div class="step-lux-num">03</div>
        <h3>Installation</h3>
        <p>Vetted crews execute to manufacturer spec. Your property is protected every day we are on site.</p>
      </div>
      <div class="step-lux">
        <div class="step-lux-num">04</div>
        <h3>Certification</h3>
        <p>Post-install inspection, manufacturer certification, and your Aevum guarantee. Full documentation for your records.</p>
      </div>
    </div>
  </div>
</section>

<section id="cta">
  <div class="section-inner">
    <div class="section-label" style="justify-content:center">Begin</div>
    <h2>${heroHeadline}</h2>
    <p class="lead">${heroSub}</p>
    <a href="/site/${slug}/assessment" class="btn-gold" style="font-size:0.75rem;padding:1.1rem 2.8rem;">${ctaText}</a>
    <p class="cta-note">$10,000 minimum · ${serviceArea} · Expanding nationally</p>
  </div>
</section>

<footer>
  <div class="footer-brand">AEVUM &nbsp;<strong>ROOFING</strong></div>
  <div class="footer-meta">
    ${tagline}<br>
    ${serviceArea}<br>
    &copy; ${new Date().getFullYear()} Aevum Roofing. All Rights Reserved.
  </div>
</footer>

</body>
</html>`;
};

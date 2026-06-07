module.exports = function generateAssessmentHTML(config) {
  const {
    tagline = 'Built to Last an Era',
    serviceArea = 'NJ · NY · PA',
    slug = 'aevum',
  } = config;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Project Assessment — AEVUM</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #E8E4DC;
    --cream-dark: #D8D4CC;
    --ink: #0D0D0D;
    --ink-mid: #2A2A2A;
    --muted: #6A6A6A;
    --bebas: 'Bebas Neue', sans-serif;
    --mono: 'Courier Prime', monospace;
    --serif: 'IM Fell English', serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--ink);
    color: var(--cream);
    font-family: var(--mono);
    overflow-x: hidden;
    cursor: crosshair;
    min-height: 100vh;
  }

  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 2.5rem;
    background: var(--ink);
    border-bottom: 2px solid #2A2A2A;
  }

  .nav-back {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: color 0.2s, border-color 0.2s;
  }

  .nav-back:hover { color: var(--cream); border-color: var(--cream); }

  .page-wrap {
    padding: 8rem 2.5rem 6rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .page-label {
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #444;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .page-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #2A2A2A;
    max-width: 80px;
  }

  .page-title {
    font-family: var(--bebas);
    font-size: clamp(3rem, 7vw, 5.5rem);
    letter-spacing: 0.05em;
    color: var(--cream);
    line-height: 0.95;
    margin-bottom: 1rem;
  }

  .page-intro {
    font-family: var(--serif);
    font-size: 1rem;
    font-style: italic;
    color: #777;
    max-width: 560px;
    line-height: 1.7;
    margin-bottom: 3.5rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid #2A2A2A;
  }

  .form-field {
    border-right: 1px solid #2A2A2A;
    border-bottom: 1px solid #2A2A2A;
  }

  .form-field.full { grid-column: 1 / -1; border-right: none; }
  .form-field:nth-child(even):not(.full) { border-right: none; }

  .form-label {
    font-family: var(--mono);
    font-size: 0.58rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #444;
    padding: 0.8rem 1.2rem 0;
    display: block;
  }

  .form-input, .form-select {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--mono);
    font-size: 0.82rem;
    color: var(--cream);
    padding: 0.4rem 1.2rem 0.9rem;
    cursor: crosshair;
    -webkit-appearance: none;
  }

  .form-select option { background: var(--ink); color: var(--cream); }

  .form-input::placeholder { color: #333; }

  .form-input:focus, .form-select:focus { background: #111; }

  .form-submit-row {
    grid-column: 1 / -1;
    border-top: 1px solid #2A2A2A;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .form-disclaimer {
    font-family: var(--mono);
    font-size: 0.6rem;
    color: #333;
    letter-spacing: 0.1em;
    max-width: 340px;
    line-height: 1.6;
  }

  .btn-submit {
    font-family: var(--bebas);
    font-size: 1rem;
    letter-spacing: 0.2em;
    color: var(--ink);
    background: var(--cream);
    border: 2px solid var(--cream);
    padding: 0.9rem 2.5rem;
    cursor: crosshair;
    transition: all 0.2s;
  }

  .btn-submit:hover { background: transparent; color: var(--cream); }

  .success-msg {
    display: none;
    background: #0D2B0D;
    border: 1px solid #2A4A2A;
    padding: 2rem;
    margin-top: 2rem;
    font-family: var(--mono);
    font-size: 0.82rem;
    color: #7FBF7F;
    letter-spacing: 0.05em;
    line-height: 1.8;
  }

  footer {
    background: var(--ink);
    padding: 2rem 2.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    border-top: 1px solid #2A2A2A;
  }

  .footer-meta {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: #333;
    text-align: right;
    line-height: 1.8;
  }

  @media (hover: none) { body, button, a { cursor: auto; } }

  @media (max-width: 768px) {
    nav { padding: 1rem 1.2rem; }
    .page-wrap { padding: 7rem 1.2rem 4rem; }
    .form-grid { grid-template-columns: 1fr; }
    .form-field { border-right: none !important; }
    footer { padding: 1.5rem 1.2rem; }
    .footer-meta { text-align: left; }
  }
</style>
</head>
<body>

<nav>
  <a href="/login" style="display:flex;flex-direction:column;gap:0;text-decoration:none;">
    <span style="font-family:var(--bebas);font-size:0.75rem;letter-spacing:0.3em;color:var(--muted);line-height:1;"><span style="color:#555;margin-right:0.2rem;">//</span>THE FORGE</span>
    <span style="font-family:var(--bebas);font-size:1.4rem;letter-spacing:0.12em;color:var(--cream);line-height:1;"><span style="color:var(--muted);margin-right:0.3rem;">//</span>AEVUM ROOFING</span>
  </a>
  <a href="/site/${slug}" class="nav-back">← Back to Home</a>
</nav>

<div class="page-wrap">
  <div class="page-label">Project Assessment Request</div>
  <h1 class="page-title">LET'S TALK<br>ABOUT YOUR<br>PROJECT.</h1>
  <p class="page-intro">We review every inquiry before scheduling. If your project aligns with our capabilities, a senior specialist will reach out within one business day.</p>

  <form id="assessment-form" action="/api/site/assessment" method="POST">
    <input type="hidden" name="siteSlug" value="${slug}">
    <div class="form-grid">

      <div class="form-field">
        <label class="form-label" for="name">Full Name *</label>
        <input class="form-input" type="text" id="name" name="name" placeholder="Jane Smith" required>
      </div>

      <div class="form-field">
        <label class="form-label" for="email">Email Address *</label>
        <input class="form-input" type="email" id="email" name="email" placeholder="jane@example.com" required>
      </div>

      <div class="form-field">
        <label class="form-label" for="phone">Phone Number</label>
        <input class="form-input" type="tel" id="phone" name="phone" placeholder="(201) 555-0100">
      </div>

      <div class="form-field">
        <label class="form-label" for="state">State</label>
        <select class="form-select" id="state" name="state">
          <option value="">Select state</option>
          <option value="NJ">New Jersey</option>
          <option value="NY">New York</option>
          <option value="PA">Pennsylvania</option>
          <option value="CT">Connecticut</option>
          <option value="DE">Delaware</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div class="form-field full">
        <label class="form-label" for="address">Property Address</label>
        <input class="form-input" type="text" id="address" name="address" placeholder="123 Estate Drive, Short Hills, NJ 07078">
      </div>

      <div class="form-field">
        <label class="form-label" for="projectType">Project Type *</label>
        <select class="form-select" id="projectType" name="projectType" required>
          <option value="">Select type</option>
          <option value="Full Replacement">Full Roof Replacement</option>
          <option value="New Construction">New Construction</option>
          <option value="Premium Upgrade">Premium Materials Upgrade</option>
          <option value="Repair">Repair / Restoration</option>
          <option value="Inspection">Inspection &amp; Assessment Only</option>
        </select>
      </div>

      <div class="form-field">
        <label class="form-label" for="budget">Estimated Budget Range</label>
        <select class="form-select" id="budget" name="budget">
          <option value="">Select range</option>
          <option value="$10K–$25K">$10,000 – $25,000</option>
          <option value="$25K–$75K">$25,000 – $75,000</option>
          <option value="$75K–$150K">$75,000 – $150,000</option>
          <option value="$150K+">$150,000+</option>
          <option value="Unknown">Not Sure Yet</option>
        </select>
      </div>

      <div class="form-field full">
        <label class="form-label" for="notes">Tell Us About Your Project</label>
        <textarea class="form-input" id="notes" name="notes" rows="4" style="resize:vertical" placeholder="Current roofing material, known issues, timeline, any specific material preferences…"></textarea>
      </div>

      <div class="form-submit-row">
        <p class="form-disclaimer">We respond within one business day. $10,000 minimum project value. ${serviceArea}.</p>
        <button type="submit" class="btn-submit">Submit Assessment Request →</button>
      </div>

    </div>
  </form>

  <div class="success-msg" id="success-msg">
    ✓ Request received. A senior Aevum specialist will review your project and reach out within one business day.<br><br>
    We appreciate your interest — and we look forward to learning more about what you're building.
  </div>
</div>

<footer>
  <div style="display:flex;flex-direction:column;gap:0;">
    <span style="font-family:var(--bebas);font-size:0.65rem;letter-spacing:0.3em;color:#333;line-height:1;"><span style="color:#555;">//</span>THE FORGE</span>
    <span style="font-family:var(--bebas);font-size:1.1rem;letter-spacing:0.12em;color:var(--cream);line-height:1;"><span style="color:var(--muted);">//</span>AEVUM ROOFING</span>
  </div>
  <div class="footer-meta">
    ${tagline}<br>
    ${serviceArea}<br>
    &copy; ${new Date().getFullYear()} Aevum Roofing. All Rights Reserved.
  </div>
</footer>

<script>
  document.getElementById('assessment-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = this.querySelector('.btn-submit');
    btn.textContent = 'Submitting…';
    btn.disabled = true;

    const data = Object.fromEntries(new FormData(this));
    try {
      const res = await fetch('/api/site/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        this.style.display = 'none';
        document.getElementById('success-msg').style.display = 'block';
      } else {
        btn.textContent = 'Submit Assessment Request →';
        btn.disabled = false;
        alert('Something went wrong. Please try again or call us directly.');
      }
    } catch {
      btn.textContent = 'Submit Assessment Request →';
      btn.disabled = false;
      alert('Network error. Please try again.');
    }
  });
</script>

</body>
</html>`;
};

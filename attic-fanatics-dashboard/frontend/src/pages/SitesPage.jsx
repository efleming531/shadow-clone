import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

// ── style tokens ────────────────────────────────────────────────────────────
const S = {
  page: { background: '#0D0D0D', minHeight: '100vh', color: '#E8E4DC', fontFamily: 'var(--font-mono)' },
  header: { borderBottom: '2px solid #E8E4DC22', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.15em', color: '#E8E4DC', lineHeight: 1 },
  sub: { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#6A6A6A', marginTop: 4 },
  btn: (primary) => ({
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.18em',
    textTransform: 'uppercase', padding: primary ? '10px 24px' : '9px 20px',
    border: `2px solid ${primary ? '#E8E4DC' : '#E8E4DC44'}`,
    background: primary ? '#E8E4DC' : 'transparent',
    color: primary ? '#0D0D0D' : '#E8E4DC',
    cursor: 'crosshair', transition: 'all 0.15s',
  }),
  input: {
    width: '100%', background: '#111', border: '2px solid #2A2A2A', outline: 'none',
    color: '#E8E4DC', padding: '10px 12px', fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem', resize: 'vertical', transition: 'border-color 0.15s',
  },
  label: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6A6A6A', display: 'block', marginBottom: 6 },
  card: { background: '#111', border: '2px solid #E8E4DC11', padding: 24 },
  sectionHead: { fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.15em', color: '#6A6A6A', marginBottom: 20 },
};

const TEMPLATES = [
  { id: 'aevum-brutalist', label: 'Brutalist', desc: 'Cream · Ink · Forge', color: '#E8E4DC', text: '#0D0D0D' },
  { id: 'clean-minimal', label: 'Minimal', desc: 'White · Blue · Clean', color: '#FFFFFF', text: '#111111' },
  { id: 'dark-luxury', label: 'Luxury', desc: 'Black · Gold · Premium', color: '#050505', text: '#C9A84C' },
];

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── SiteCard ─────────────────────────────────────────────────────────────────
function SiteCard({ site, onEdit, isSelected }) {
  const url = site.customDomain ? `https://${site.customDomain}` : `/site/${site.slug}`;
  return (
    <div style={{
      background: isSelected ? '#161616' : '#111',
      border: `2px solid ${isSelected ? '#E8E4DC44' : '#E8E4DC11'}`,
      padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.1em', color: '#E8E4DC', lineHeight: 1 }}>
            // {site.slug}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#6A6A6A', marginTop: 4 }}>
            {url}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: site.isLive ? '#22c55e' : '#555', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: site.isLive ? '#22c55e' : '#555' }}>
            {site.isLive ? 'Live' : 'Draft'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid #2A2A2A', color: '#6A6A6A' }}>
          {site.template || 'aevum-brutalist'}
        </span>
        {site._count?.deploys > 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid #2A2A2A', color: '#6A6A6A' }}>
            {site._count.deploys} deploy{site._count.deploys !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#4A4A4A' }}>
        Published: {timeAgo(site.publishedAt)}
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onEdit(site)} style={S.btn(isSelected)}>
          {isSelected ? '// Editing' : '// Edit'}
        </button>
        <a href={`/site/${site.slug}`} target="_blank" rel="noreferrer"
          style={{ ...S.btn(false), textDecoration: 'none', display: 'inline-block' }}>
          ↗ Open
        </a>
      </div>
    </div>
  );
}

// ── NewSiteModal ──────────────────────────────────────────────────────────────
function NewSiteModal({ onClose, onCreated, existingSlugs }) {
  const [form, setForm] = useState({ name: '', slug: '', template: 'aevum-brutalist', heroHeadline: '', ctaText: '', serviceArea: '' });
  const [slugError, setSlugError] = useState('');
  const [creating, setCreating] = useState(false);

  function handleNameChange(val) {
    const auto = slugify(val);
    setForm(f => ({ ...f, name: val, slug: auto }));
    validateSlug(auto);
  }

  function handleSlugChange(val) {
    setForm(f => ({ ...f, slug: val }));
    validateSlug(val);
  }

  function validateSlug(s) {
    if (!s) { setSlugError('Slug is required'); return false; }
    if (!/^[a-z0-9-]+$/.test(s)) { setSlugError('Lowercase letters, numbers, and hyphens only'); return false; }
    if (existingSlugs.includes(s)) { setSlugError('This slug is already taken'); return false; }
    setSlugError('');
    return true;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!validateSlug(form.slug)) return;
    setCreating(true);
    try {
      const payload = { slug: form.slug, template: form.template };
      if (form.heroHeadline) payload.heroHeadline = form.heroHeadline;
      if (form.ctaText) payload.ctaText = form.ctaText;
      if (form.serviceArea) payload.serviceArea = form.serviceArea;
      const res = await api.post('/sites', payload);
      onCreated(res.data);
      toast.success(`Site // ${form.slug} created`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create site');
    }
    setCreating(false);
  }

  const inputStyle = { ...S.input, marginBottom: 0 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0D0D0D', border: '2px solid #E8E4DC22', padding: 40, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <p style={S.title}>// NEW SITE</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6A6A6A', cursor: 'crosshair', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={S.label}>Site Name</label>
            <input style={inputStyle} value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="My Roofing Site" />
          </div>

          <div>
            <label style={S.label}>URL Slug *</label>
            <input style={{ ...inputStyle, borderColor: slugError ? '#ef4444' : '#2A2A2A' }}
              value={form.slug} onChange={e => handleSlugChange(e.target.value)} placeholder="my-roofing-site" required />
            {slugError
              ? <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#ef4444', marginTop: 4 }}>{slugError}</p>
              : form.slug && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#6A6A6A', marginTop: 4 }}>Your site URL: /site/{form.slug}</p>
            }
          </div>

          <div>
            <label style={S.label}>Template</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, template: t.id }))}
                  style={{
                    flex: 1, border: `2px solid ${form.template === t.id ? '#E8E4DC' : '#2A2A2A'}`,
                    padding: '10px 8px', background: 'transparent', cursor: 'crosshair', textAlign: 'center',
                  }}>
                  <div style={{ width: 32, height: 32, background: t.color, border: `1px solid ${t.text}22`, margin: '0 auto 6px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 4, left: 4, right: 4, height: 2, background: t.text, opacity: 0.6 }} />
                    <div style={{ position: 'absolute', top: 9, left: 4, right: 8, height: 1, background: t.text, opacity: 0.3 }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: form.template === t.id ? '#E8E4DC' : '#6A6A6A' }}>{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={S.label}>Hero Headline (optional)</label>
            <input style={inputStyle} value={form.heroHeadline} onChange={e => setForm(f => ({ ...f, heroHeadline: e.target.value }))} placeholder="READY TO BUILD SOMETHING EXCEPTIONAL?" />
          </div>

          <div>
            <label style={S.label}>CTA Button Text (optional)</label>
            <input style={inputStyle} value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="Request a Project Assessment" />
          </div>

          <div>
            <label style={S.label}>Service Area (optional)</label>
            <input style={inputStyle} value={form.serviceArea} onChange={e => setForm(f => ({ ...f, serviceArea: e.target.value }))} placeholder="NJ · NY · PA" />
          </div>

          <button type="submit" disabled={creating || !!slugError} style={{ ...S.btn(true), opacity: creating || !!slugError ? 0.6 : 1, cursor: creating || !!slugError ? 'not-allowed' : 'crosshair' }}>
            {creating ? '// Creating…' : '// Create Site'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Editor Panel ─────────────────────────────────────────────────────────────
function EditorPanel({ site, onSaved }) {
  const [form, setForm] = useState({
    heroHeadline: site.heroHeadline || '',
    heroSub: site.heroSub || '',
    ctaText: site.ctaText || '',
    tagline: site.tagline || '',
    serviceArea: site.serviceArea || '',
    template: site.template || 'aevum-brutalist',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [deploys, setDeploys] = useState([]);
  const [domainInput, setDomainInput] = useState(site.customDomain || '');
  const [dnsInstructions, setDnsInstructions] = useState(null);
  const [connectingDomain, setConnectingDomain] = useState(false);
  const [rollbackConfirm, setRollbackConfirm] = useState(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [iframeSrc, setIframeSrc] = useState(`/site/${site.slug}?t=${Date.now()}`);
  const iframeRef = useRef(null);

  useEffect(() => {
    api.get(`/sites/${site.slug}/deploys`).then(r => setDeploys(r.data)).catch(() => {});
  }, [site.slug]);

  function updateForm(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setIsDirty(true);
  }

  async function handleSaveDraft(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.patch(`/sites/${site.slug}`, form);
      setIsDirty(false);
      setIframeSrc(`/site/${site.slug}?t=${Date.now()}`);
      onSaved(updated.data);
      toast.success('Draft saved — preview updated');
    } catch { toast.error('Failed to save draft'); }
    setSaving(false);
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await api.patch(`/sites/${site.slug}`, form);
      const res = await api.post(`/sites/${site.slug}/publish`);
      setIsDirty(false);
      setPublished(true);
      setIframeSrc(`/site/${site.slug}?t=${Date.now()}`);
      const deploysRes = await api.get(`/sites/${site.slug}/deploys`);
      setDeploys(deploysRes.data);
      onSaved({ ...site, publishedAt: res.data.publishedAt, isLive: true });
      toast.success('Site published!');
      setTimeout(() => setPublished(false), 3000);
    } catch { toast.error('Failed to publish'); }
    setPublishing(false);
  }

  async function handleConnectDomain() {
    if (!domainInput.trim()) return;
    setConnectingDomain(true);
    try {
      const res = await api.post(`/sites/${site.slug}/connect-domain`, { domain: domainInput.trim() });
      setDnsInstructions(res.data.instructions);
      onSaved({ ...site, customDomain: domainInput.trim() });
      toast.success('Domain connected');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid domain');
    }
    setConnectingDomain(false);
  }

  async function handleRollback() {
    if (!rollbackConfirm) return;
    setRollingBack(true);
    try {
      await api.post(`/sites/${site.slug}/rollback/${rollbackConfirm}`);
      setIframeSrc(`/site/${site.slug}?t=${Date.now()}`);
      const deploysRes = await api.get(`/sites/${site.slug}/deploys`);
      setDeploys(deploysRes.data);
      setRollbackConfirm(null);
      toast.success('Version restored');
    } catch { toast.error('Rollback failed'); }
    setRollingBack(false);
  }

  const inputStyle = { ...S.input };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* Left: iframe 35% */}
      <div style={{ width: '35%', borderRight: '2px solid #E8E4DC11', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E8E4DC11', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6A6A6A' }}>Live Preview</p>
          <a href={`/site/${site.slug}`} target="_blank" rel="noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6A6A6A', textDecoration: 'none' }}>
            ↗ Open
          </a>
        </div>

        {/* URL pill */}
        <div style={{ padding: '8px 20px', borderBottom: '1px solid #E8E4DC11', flexShrink: 0 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#4A4A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {site.customDomain ? `https://${site.customDomain}` : `…/site/${site.slug}`}
          </p>
        </div>

        {/* Template selector */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E8E4DC11', flexShrink: 0 }}>
          <p style={{ ...S.label, marginBottom: 8 }}>Template</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => updateForm('template', t.id)}
                style={{
                  flex: 1, border: `1px solid ${form.template === t.id ? '#E8E4DC88' : '#2A2A2A'}`,
                  padding: '6px 4px', background: 'transparent', cursor: 'crosshair', textAlign: 'center',
                }}>
                <div style={{ width: 20, height: 16, background: t.color, margin: '0 auto 4px' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: form.template === t.id ? '#E8E4DC' : '#555' }}>{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          style={{ flex: 1, border: 'none', background: '#E8E4DC' }}
          title="Site Preview"
        />
      </div>

      {/* Center: content editor 35% */}
      <div style={{ width: '35%', borderRight: '2px solid #E8E4DC11', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.15em', color: '#6A6A6A' }}>// CONTENT</p>
            {isDirty && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#f97316', letterSpacing: '0.1em' }}>Unsaved changes</span>}
          </div>

          <form onSubmit={handleSaveDraft} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ ...S.card, padding: 20 }}>
              <p style={{ ...S.sectionHead, marginBottom: 16 }}>// HERO</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={S.label}>Hero Headline</label>
                  <textarea rows={2} style={inputStyle} value={form.heroHeadline} onChange={e => updateForm('heroHeadline', e.target.value)} placeholder="READY TO BUILD SOMETHING EXCEPTIONAL?" />
                </div>
                <div>
                  <label style={S.label}>Hero Subheadline</label>
                  <textarea rows={3} style={inputStyle} value={form.heroSub} onChange={e => updateForm('heroSub', e.target.value)} placeholder="We don't do standard jobs…" />
                </div>
                <div>
                  <label style={S.label}>CTA Button Text</label>
                  <input style={inputStyle} value={form.ctaText} onChange={e => updateForm('ctaText', e.target.value)} placeholder="Request a Project Assessment" />
                </div>
              </div>
            </div>

            <div style={{ ...S.card, padding: 20 }}>
              <p style={{ ...S.sectionHead, marginBottom: 16 }}>// BRAND</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={S.label}>Tagline</label>
                  <input style={inputStyle} value={form.tagline} onChange={e => updateForm('tagline', e.target.value)} placeholder="Built to Last an Era" />
                </div>
                <div>
                  <label style={S.label}>Service Area</label>
                  <input style={inputStyle} value={form.serviceArea} onChange={e => updateForm('serviceArea', e.target.value)} placeholder="NJ · NY · PA" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving} style={{ ...S.btn(!isDirty), opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'crosshair' }}>
              {saving ? '// Saving…' : isDirty ? '// Save Draft' : '// Saved'}
            </button>
          </form>
        </div>
      </div>

      {/* Right: publish + domain + history 30% */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Publish */}
          <div style={S.card}>
            <p style={S.sectionHead}>// PUBLISH</p>
            <button onClick={handlePublish} disabled={publishing || published}
              style={{
                width: '100%', fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.15em',
                border: '2px solid #E8E4DC', padding: '14px 0',
                background: published ? '#22c55e22' : publishing ? 'transparent' : '#E8E4DC',
                color: published ? '#22c55e' : publishing ? '#E8E4DC' : '#0D0D0D',
                cursor: publishing || published ? 'not-allowed' : 'crosshair', transition: 'all 0.2s',
              }}>
              {published ? '✓ PUBLISHED' : publishing ? '// Publishing…' : '// PUBLISH SITE'}
            </button>
            {site.publishedAt && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#4A4A4A', marginTop: 10, letterSpacing: '0.08em' }}>
                Last published {timeAgo(site.publishedAt)}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: site.isLive ? '#22c55e' : '#555' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: site.isLive ? '#22c55e' : '#555', letterSpacing: '0.12em' }}>
                {site.isLive ? 'Site is live' : 'Not yet published'}
              </span>
            </div>
          </div>

          {/* Domain */}
          <div style={S.card}>
            <p style={S.sectionHead}>// DOMAIN</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#6A6A6A', marginBottom: 12 }}>
              {site.customDomain ? `Connected: ${site.customDomain}` : 'No custom domain connected'}
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: dnsInstructions ? 16 : 0 }}>
              <input
                style={{ ...S.input, flex: 1, marginBottom: 0 }}
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                placeholder="yourdomain.com"
              />
              <button onClick={handleConnectDomain} disabled={connectingDomain}
                style={{ ...S.btn(false), flexShrink: 0, opacity: connectingDomain ? 0.6 : 1 }}>
                {connectingDomain ? '…' : 'Connect'}
              </button>
            </div>

            {dnsInstructions && (
              <div style={{ marginTop: 16, background: '#0A0A0A', border: '1px solid #2A2A2A', padding: 16 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6A6A6A', marginBottom: 10 }}>
                  Add this DNS record at your registrar:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
                  {['type', 'host', 'value', 'ttl'].map(k => (
                    <React.Fragment key={k}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#E8E4DC' }}>{dnsInstructions[k]}</span>
                    </React.Fragment>
                  ))}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(dnsInstructions.value).then(() => toast.success('Copied!'))}
                  style={{ ...S.btn(false), marginTop: 10, fontSize: '0.6rem', padding: '6px 14px' }}>
                  Copy CNAME Value
                </button>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#4A4A4A', marginTop: 8 }}>
                  DNS verification coming soon
                </p>
              </div>
            )}
          </div>

          {/* Deploy history */}
          <div style={S.card}>
            <p style={S.sectionHead}>// DEPLOY HISTORY</p>
            {deploys.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#4A4A4A' }}>No deploys yet. Publish to create the first.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {deploys.slice(0, 5).map(d => (
                  <div key={d.id} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#E8E4DC' }}>
                          {d.deployedBy || 'Unknown'} · {timeAgo(d.deployedAt)}
                        </p>
                        {d.preview?.heroHeadline && (
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#4A4A4A', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                            {d.preview.heroHeadline}
                          </p>
                        )}
                      </div>
                      {rollbackConfirm === d.id ? (
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={handleRollback} disabled={rollingBack}
                            style={{ ...S.btn(true), fontSize: '0.58rem', padding: '4px 10px', opacity: rollingBack ? 0.6 : 1 }}>
                            Confirm
                          </button>
                          <button onClick={() => setRollbackConfirm(null)}
                            style={{ ...S.btn(false), fontSize: '0.58rem', padding: '4px 10px' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setRollbackConfirm(d.id)}
                          style={{ ...S.btn(false), fontSize: '0.58rem', padding: '4px 10px', flexShrink: 0 }}>
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SitesPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    api.get('/sites').then(r => {
      setSites(r.data);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load sites');
      setLoading(false);
    });
  }, []);

  function handleEdit(site) {
    setSelectedSite(site);
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function handleSaved(updated) {
    setSites(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    setSelectedSite(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
  }

  function handleCreated(newSite) {
    setSites(prev => [newSite, ...prev]);
    setShowNewModal(false);
    setSelectedSite(newSite);
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  return (
    <div style={S.page}>
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <p style={S.title}>// SITES</p>
          <p style={S.sub}>Manage your hosted pages</p>
        </div>
        <button onClick={() => setShowNewModal(true)} style={S.btn(true)}>+ New Site</button>
      </div>

      {/* ── SITE LIST ───────────────────────────────────────────── */}
      <div style={{ padding: '32px 32px 0' }}>
        {loading ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#6A6A6A' }}>Loading…</p>
        ) : sites.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#6A6A6A' }}>No sites yet. Click "New Site" to create one.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {sites.map(site => (
              <SiteCard key={site.id} site={site} onEdit={handleEdit} isSelected={selectedSite?.id === site.id} />
            ))}
          </div>
        )}
      </div>

      {/* ── EDITOR PANEL ────────────────────────────────────────── */}
      {selectedSite && (
        <div ref={editorRef} style={{ marginTop: 32, borderTop: '2px solid #E8E4DC22', display: 'flex', flexDirection: 'column', height: '80vh' }}>
          <div style={{ padding: '16px 32px', borderBottom: '1px solid #E8E4DC11', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.15em', color: '#E8E4DC' }}>
              // EDITING — {selectedSite.slug}
            </p>
            <button onClick={() => setSelectedSite(null)} style={{ background: 'none', border: 'none', color: '#6A6A6A', cursor: 'crosshair', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
              ✕ Close Editor
            </button>
          </div>
          <EditorPanel site={selectedSite} onSaved={handleSaved} />
        </div>
      )}

      {/* ── NEW SITE MODAL ───────────────────────────────────────── */}
      {showNewModal && (
        <NewSiteModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleCreated}
          existingSlugs={sites.map(s => s.slug)}
        />
      )}
    </div>
  );
}

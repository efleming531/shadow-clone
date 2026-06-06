import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const LIVE_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:${window.location.port.replace('3000', '4000') || window.location.port}/site/aevum`
  : '/site/aevum';

const IFRAME_URL = '/site/aevum';

export default function SitesPage() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    api.get('/sites/aevum').then(r => {
      setConfig(r.data);
      setForm({
        heroHeadline: r.data.heroHeadline,
        heroSub: r.data.heroSub,
        ctaText: r.data.ctaText,
        tagline: r.data.tagline,
        serviceArea: r.data.serviceArea,
      });
    }).catch(() => toast.error('Failed to load site config'));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.patch('/sites/aevum', form);
      setConfig(r.data);
      toast.success('Site updated — regenerating page…');
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = IFRAME_URL + '?t=' + Date.now();
        }
      }, 400);
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(LIVE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const Label = ({ children }) => (
    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6A6A6A', display: 'block', marginBottom: '6px' }}>
      {children}
    </label>
  );

  const inputStyle = {
    width: '100%',
    background: '#E8E4DC',
    border: '2px solid #0D0D0D',
    borderRadius: 0,
    color: '#0D0D0D',
    padding: '10px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'crosshair',
    resize: 'vertical',
  };

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', flexDirection: 'column', cursor: 'crosshair' }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #E8E4DC22', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.15em', color: '#E8E4DC', lineHeight: 1 }}>// SITES</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', color: '#6A6A6A', marginTop: '4px' }}>Aevum Roofing — Live Landing Page</p>
        </div>
        {/* URL pill */}
        <button
          onClick={handleCopy}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid #E8E4DC22', padding: '10px 20px', background: 'transparent', cursor: 'crosshair', color: '#E8E4DC', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#E8E4DC88'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E4DC22'}
        >
          <span style={{ color: '#6A6A6A' }}>↗</span>
          <span style={{ color: '#9A9A9A' }}>{LIVE_URL}</span>
          <span style={{ marginLeft: '8px', fontSize: '0.65rem', color: copied ? '#22c55e' : '#6A6A6A' }}>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>

      {/* Split panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: iframe 40% */}
        <div style={{ width: '40%', borderRight: '2px solid #E8E4DC22', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #E8E4DC11' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6A6A6A' }}>Live Preview</p>
          </div>
          <iframe
            ref={iframeRef}
            src={IFRAME_URL}
            style={{ flex: 1, border: 'none', background: '#E8E4DC' }}
            title="Aevum Site Preview"
          />
        </div>

        {/* Right: edit form 60% */}
        <div style={{ width: '60%', overflowY: 'auto', padding: '40px 48px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.15em', color: '#E8E4DC', marginBottom: '32px' }}>// EDIT CONTENT</p>

          {config === null ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#6A6A6A' }}>Loading…</p>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

              <div style={{ background: '#161616', border: '2px solid #E8E4DC11', padding: '28px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.15em', color: '#6A6A6A', marginBottom: '20px' }}>// HERO</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <Label>Hero Headline</Label>
                    <textarea
                      rows={2}
                      style={inputStyle}
                      value={form.heroHeadline || ''}
                      onChange={e => setForm(f => ({ ...f, heroHeadline: e.target.value }))}
                      placeholder="Roofing Engineered for Exceptional Homes."
                    />
                  </div>
                  <div>
                    <Label>Hero Subheadline</Label>
                    <textarea
                      rows={3}
                      style={inputStyle}
                      value={form.heroSub || ''}
                      onChange={e => setForm(f => ({ ...f, heroSub: e.target.value }))}
                      placeholder="We don't do standard jobs…"
                    />
                  </div>
                  <div>
                    <Label>CTA Button Text</Label>
                    <input
                      style={inputStyle}
                      value={form.ctaText || ''}
                      onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                      placeholder="Request a Project Assessment"
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: '#161616', border: '2px solid #E8E4DC11', padding: '28px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.15em', color: '#6A6A6A', marginBottom: '20px' }}>// BRAND</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <Label>Tagline</Label>
                    <input
                      style={inputStyle}
                      value={form.tagline || ''}
                      onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                      placeholder="Built to Last an Era"
                    />
                  </div>
                  <div>
                    <Label>Service Area</Label>
                    <input
                      style={inputStyle}
                      value={form.serviceArea || ''}
                      onChange={e => setForm(f => ({ ...f, serviceArea: e.target.value }))}
                      placeholder="NJ · NY · PA"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  border: '2px solid #E8E4DC',
                  padding: '16px 40px',
                  background: saving ? 'transparent' : '#E8E4DC',
                  color: saving ? '#E8E4DC' : '#0D0D0D',
                  cursor: saving ? 'not-allowed' : 'crosshair',
                  opacity: saving ? 0.6 : 1,
                  alignSelf: 'flex-start',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E8E4DC'; }}}
                onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = '#E8E4DC'; e.currentTarget.style.color = '#0D0D0D'; }}}
              >
                {saving ? '// Saving…' : '// Save & Publish'}
              </button>

              {config.updatedAt && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#4A4A4A', letterSpacing: '0.1em' }}>
                  Last published: {new Date(config.updatedAt).toLocaleString()}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function CustomerLoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const t = params.get('token');
    if (t) handleLogin(t);
  }, []);

  async function handleLogin(t) {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/customer-login', { portalToken: t || token });
      localStorage.setItem('forge_token', res.data.token);
      navigate(`/portal/${res.data.customer.id}/overview`);
    } catch {
      setError('Invalid portal token. Please check your link and try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E8E4DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Courier Prime, monospace' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
        <div style={{ border: '2px solid #0D0D0D', padding: '48px 40px', background: '#E8E4DC' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', letterSpacing: '0.3em', color: '#6A6A6A', marginBottom: 4 }}>// AEVUM</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.12em', color: '#0D0D0D', lineHeight: 1, marginBottom: 32 }}>CLIENT PORTAL</div>
          {error && <div style={{ background: '#FFEAEA', border: '2px solid #CC0000', color: '#CC0000', padding: '10px 14px', fontSize: '0.75rem', marginBottom: 20 }}>{error}</div>}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6A6A6A', marginBottom: 0 }}>Portal Access Token</label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste your token here"
              style={{ width: '100%', border: '2px solid #0D0D0D', borderTop: 'none', background: 'transparent', padding: '10px 14px', fontFamily: 'Courier Prime, monospace', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
          <button
            onClick={() => handleLogin()}
            disabled={loading || !token}
            style={{ width: '100%', background: '#0D0D0D', color: '#E8E4DC', border: '2px solid #0D0D0D', padding: '14px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.2em', cursor: 'crosshair' }}
          >
            {loading ? 'ACCESSING...' : 'ACCESS PORTAL'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.75rem', color: '#6A6A6A' }}>
            <a href="/login" style={{ color: '#6A6A6A' }}>← Back to staff login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

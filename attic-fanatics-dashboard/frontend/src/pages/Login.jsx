import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      // Route based on role
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid email or password');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E8E4DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier Prime', monospace", cursor: 'crosshair' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
        <div style={{ border: '2px solid #0D0D0D', padding: '56px 48px', background: '#E8E4DC' }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.75rem', letterSpacing: '0.3em', color: '#6A6A6A', lineHeight: 1, marginBottom: 2 }}>// THE FORGE</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '0.12em', color: '#0D0D0D', lineHeight: 1 }}>AEVUM ROOFING</div>
          </div>

          {error && (
            <div style={{ background: '#FFEAEA', border: '2px solid #CC0000', color: '#CC0000', padding: '10px 14px', fontFamily: "'Courier Prime', monospace", fontSize: '0.75rem', letterSpacing: '0.05em', marginBottom: 24 }}>
              // {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6A6A6A', padding: '10px 0 0' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@aevumroofing.com"
                style={{ width: '100%', border: '2px solid #0D0D0D', background: 'transparent', padding: '8px 14px 12px', fontFamily: "'Courier Prime', monospace", fontSize: '0.9rem', color: '#0D0D0D', outline: 'none', display: 'block', cursor: 'crosshair' }}
              />
            </div>
            <div style={{ marginBottom: 32, borderTop: '2px solid #0D0D0D' }}>
              <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6A6A6A', padding: '10px 0 0', paddingLeft: 0 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                style={{ width: '100%', border: '2px solid #0D0D0D', borderTop: 'none', background: 'transparent', padding: '8px 14px 12px', fontFamily: "'Courier Prime', monospace", fontSize: '0.9rem', color: '#0D0D0D', outline: 'none', display: 'block', cursor: 'crosshair' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#0D0D0D', color: '#E8E4DC', border: '2px solid #0D0D0D', padding: '16px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '0.2em', cursor: loading ? 'not-allowed' : 'crosshair', opacity: loading ? 0.6 : 1, transition: 'all 0.15s', marginBottom: 24 }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', borderTop: '1px solid #C8C4BC', paddingTop: 20 }}>
            <Link to="/portal/login" style={{ fontFamily: "'Courier Prime', monospace", fontSize: '0.75rem', letterSpacing: '0.1em', color: '#6A6A6A', textDecoration: 'none' }}>
              // Client Portal Access →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

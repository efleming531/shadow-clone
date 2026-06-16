import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MelvinLogin } from '../components/Melvin';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const overlayRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setFadingOut(true);
      setTimeout(() => navigate('/'), 380);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      style={{
        minHeight: '100vh',
        background: '#0f1113',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}
    >
      {/* Melvin floats above card */}
      <div style={{ marginBottom: 8 }}>
        <MelvinLogin />
      </div>

      {/* Login card */}
      <div style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 12,
        padding: '36px 40px',
        width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280' }}>
            Welcome to
          </p>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>
            The <span style={{ color: '#a78bfa' }}>Forge</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 6, letterSpacing: '0.05em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@atticfanatics.com"
              required
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, color: '#f1f5f9', padding: '10px 14px',
                fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#a78bfa'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 6, letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, color: '#f1f5f9', padding: '10px 14px',
                fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#a78bfa'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#5b21b6' : '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '11px 0',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              transition: 'background 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#6d28d9'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#7c3aed'; }}
          >
            {loading ? 'Entering…' : 'Enter the Forge'}
          </button>
        </form>
      </div>
    </div>
  );
}

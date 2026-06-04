import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ForgeIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L9 7C9 9 10 11 12 12C14 11 15 9 15 7L12 2Z" fill="#f97316" />
    <path d="M12 12C9.8 12 8 13.8 8 16C8 18.2 9.8 20 12 20C14.2 20 16 18.2 16 16C16 13.8 14.2 12 12 12Z" fill="#f97316" opacity="0.7" />
    <path d="M6 8L3 14L7 15L6 8Z" fill="#f97316" opacity="0.4" />
    <path d="M18 8L21 14L17 15L18 8Z" fill="#f97316" opacity="0.4" />
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center">
              <ForgeIcon />
            </div>
          </div>
          <h1 className="font-black text-3xl tracking-widest uppercase text-white">FORGE</h1>
          <p className="text-text-secondary text-sm mt-1 tracking-wide">Business Operating System</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <h2 className="font-bold text-lg text-white mb-5">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">FORGE · Powered by data</p>
      </div>
    </div>
  );
}

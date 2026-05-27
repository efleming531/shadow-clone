import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FlameIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C12 2 8 8 8 13C8 15.761 9.791 18 12 18C14.209 18 16 15.761 16 13C16 10.5 14.5 8 13 6.5C14 9 15 11 15 13C15 15.761 13.657 17 12 17C10.343 17 9 15.761 9 13C9 8 12 2 12 2Z" fill="#f97316"/>
    <ellipse cx="12" cy="20.5" rx="4" ry="2.5" fill="#f97316" opacity="0.5"/>
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
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center">
              <FlameIcon />
            </div>
          </div>
          <h1 className="font-black text-2xl tracking-widest uppercase text-white">Attic Fanatics</h1>
          <p className="text-text-secondary text-sm mt-1">Performance Dashboard</p>
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
                placeholder="you@atticfanatics.com"
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

        <p className="text-center text-xs text-text-muted mt-4">
          Attic Fanatics · NJ / NY / PA · atticfanatics.com
        </p>
      </div>
    </div>
  );
}

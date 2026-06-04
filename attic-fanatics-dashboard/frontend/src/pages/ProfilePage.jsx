import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSave(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/me', {
        name: profile.name,
        email: profile.email,
      });
      updateUser(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setSavingPassword(true);
    try {
      await api.patch('/auth/me', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  }

  const roleBadgeColor = {
    OWNER: 'bg-accent/20 text-accent border border-accent/30',
    MANAGER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    REP: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };

  return (
    <div className="p-6 max-w-xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">My Profile</h1>
        <p className="text-sm text-text-muted">Update your name, email, and password</p>
      </div>

      {/* Avatar + role */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-bg-card border border-border rounded-xl">
        <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-xl flex-shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-text-primary">{user?.name}</p>
          <p className="text-sm text-text-secondary">{user?.email}</p>
          <span className={`inline-block text-[11px] px-2 py-0.5 rounded font-semibold mt-1 ${roleBadgeColor[user?.role]}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-bold text-text-primary mb-4">Profile Info</h2>
        <form onSubmit={handleProfileSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              Display Name
            </label>
            <input
              className="forge-input"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <input
              className="forge-input"
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-text-primary mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              Current Password
            </label>
            <input
              className="forge-input"
              type="password"
              value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              New Password
            </label>
            <input
              className="forge-input"
              type="password"
              value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              Confirm New Password
            </label>
            <input
              className="forge-input"
              type="password"
              value={passwords.confirmPassword}
              onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="pt-1">
            <button
              type="submit"
              disabled={savingPassword}
              className="bg-bg-elevated hover:bg-white/10 disabled:opacity-60 border border-border text-text-primary text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

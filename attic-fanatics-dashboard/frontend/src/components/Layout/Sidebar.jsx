import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FlameIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 9 7 9 11C9 12.657 10.343 14 12 14C13.657 14 15 12.657 15 11C15 9.5 14.2 8.3 13.5 7.5C14.5 9 15 10.5 15 11C15 12.657 13.657 14 12 14C10.343 14 9 12.657 9 11C9 7 12 2 12 2Z" fill="#f97316"/>
    <path d="M12 14C9.239 14 7 16.239 7 19C7 21.761 9.239 24 12 24C14.761 24 17 21.761 17 19C17 16.239 14.761 14 12 14Z" fill="#f97316" opacity="0.7"/>
  </svg>
);

const FUNNEL_SOURCES = [
  { name: 'Google Ads', slug: 'google-ads' },
  { name: 'Facebook/Instagram', slug: 'facebook-instagram' },
  { name: 'TikTok', slug: 'tiktok' },
  { name: 'Organic', slug: 'organic' },
  { name: 'Referrals', slug: 'referrals' },
];

const NavItem = ({ to, icon, label, exact = false }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-accent-muted text-accent border border-accent/20'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
      }`
    }
  >
    <span className="text-base">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ collapsed, onClose }) {
  const { user, logout, isOwner, canManageData } = useAuth();
  const location = useLocation();
  const [funnelOpen, setFunnelOpen] = useState(location.pathname.startsWith('/funnel'));
  const isFunnelActive = location.pathname.startsWith('/funnel');

  const roleBadgeColor = {
    OWNER: 'bg-accent/20 text-accent border border-accent/30',
    MANAGER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    REP: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-bg-card border-r border-border flex flex-col z-30 transition-transform duration-200 ${collapsed ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <FlameIcon />
            <span className="font-black text-sm tracking-widest text-white uppercase">Attic Fanatics</span>
          </div>
          <p className="text-xs text-text-muted ml-7">Performance Dashboard</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavItem to="/" exact icon="⊞" label="Overview" />

          <div>
            <button
              onClick={() => setFunnelOpen(o => !o)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isFunnelActive ? 'text-accent bg-accent-muted border border-accent/20' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">◈</span>
                <span>Funnels</span>
              </div>
              <span className={`text-xs transition-transform duration-200 ${funnelOpen ? 'rotate-90' : ''}`}>▶</span>
            </button>
            {funnelOpen && (
              <div className="mt-1 ml-4 space-y-0.5 border-l border-border pl-3">
                {FUNNEL_SOURCES.map(s => (
                  <NavLink
                    key={s.slug}
                    to={`/funnel/${s.slug}`}
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive ? 'text-accent bg-accent-muted' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                      }`
                    }
                  >
                    {s.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavItem to="/sales" icon="🏆" label="Sales Leaderboard" />
          <NavItem to="/call-center" icon="📞" label="Call Center" />

          {canManageData && (
            <NavItem to="/data-entry" icon="✎" label="Data Entry" />
          )}
          {isOwner && (
            <NavItem to="/settings" icon="⚙" label="User Management" />
          )}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold ${roleBadgeColor[user?.role]}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-all text-left"
          >
            Sign out →
          </button>
        </div>
      </aside>
    </>
  );
}

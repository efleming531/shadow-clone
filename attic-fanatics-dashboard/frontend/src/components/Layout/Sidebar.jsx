import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ForgeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L9 7C9 9 10 11 12 12C14 11 15 9 15 7L12 2Z" fill="#f97316" />
    <path d="M12 12C9.8 12 8 13.8 8 16C8 18.2 9.8 20 12 20C14.2 20 16 18.2 16 16C16 13.8 14.2 12 12 12Z" fill="#f97316" opacity="0.7" />
    <path d="M6 8L3 14L7 15L6 8Z" fill="#f97316" opacity="0.4" />
    <path d="M18 8L21 14L17 15L18 8Z" fill="#f97316" opacity="0.4" />
  </svg>
);

const FUNNEL_SOURCES = [
  { name: 'Google Ads', slug: 'google-ads' },
  { name: 'Facebook/Instagram', slug: 'facebook-instagram' },
  { name: 'TikTok', slug: 'tiktok' },
  { name: 'Organic', slug: 'organic' },
  { name: 'Referrals', slug: 'referrals' },
];

function NavItem({ to, icon, label, exact = false }) {
  return (
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
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function NavGroup({ icon, label, prefix, children }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(prefix);
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive ? 'text-accent bg-accent-muted border border-accent/20' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-base leading-none">{icon}</span>
          <span>{label}</span>
        </div>
        <span className={`text-xs transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && (
        <div className="mt-0.5 ml-4 space-y-0.5 border-l border-border pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

function SubNavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          isActive ? 'text-accent bg-accent-muted' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function SectionLabel({ label }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 pt-3 pb-1">{label}</p>;
}

export default function Sidebar({ collapsed, onClose }) {
  const { user, logout, isOwner, canManageData } = useAuth();
  const location = useLocation();

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
        {/* Logo */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <ForgeIcon />
            <span className="font-black text-sm tracking-widest text-white uppercase">FORGE</span>
          </div>
          <p className="text-[10px] text-accent font-semibold uppercase tracking-widest ml-7 opacity-70">Business OS</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <NavItem to="/" exact icon="⊞" label="Overview" />

          <SectionLabel label="CRM" />
          <NavItem to="/leads/kanban" icon="⬦" label="Pipeline Kanban" />
          <NavItem to="/leads" icon="☰" label="All Leads" />
          <NavItem to="/customers" icon="👤" label="Customers" />
          <NavItem to="/estimates" icon="📋" label="Estimates" />
          <NavItem to="/jobs" icon="🔧" label="Jobs" />

          <SectionLabel label="Analytics" />
          <NavGroup icon="◈" label="Funnels" prefix="/funnel">
            {FUNNEL_SOURCES.map(s => (
              <SubNavItem key={s.slug} to={`/funnel/${s.slug}`} label={s.name} />
            ))}
          </NavGroup>
          <NavItem to="/sales" icon="🏆" label="Sales Leaderboard" />
          <NavItem to="/call-center" icon="📞" label="Call Center" />
          <NavItem to="/velocity" icon="⚡" label="Pipeline Velocity" />
          <NavItem to="/forecasting" icon="📈" label="Forecasting" />
          <NavItem to="/territory" icon="🗺" label="Territory" />
          {canManageData && <NavItem to="/unit-economics" icon="⬡" label="Unit Economics" />}

          <SectionLabel label="Revenue Ops" />
          <NavItem to="/membership" icon="★" label="Membership" />
          {canManageData && <NavItem to="/commission" icon="$" label="Commission" />}
          <NavItem to="/reputation" icon="⭐" label="Reputation" />

          <SectionLabel label="Operations" />
          <NavItem to="/sops" icon="📚" label="SOPs" />
          {canManageData && <NavItem to="/alerts" icon="🔔" label="Alerts" />}
          {canManageData && <NavItem to="/data-entry" icon="✎" label="Data Entry" />}
          {isOwner && <NavItem to="/settings" icon="⚙" label="User Management" />}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
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

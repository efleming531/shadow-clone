import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const BOTTOM_NAV = [
  { to: '/', icon: '⊞', label: 'Overview', exact: true },
  { to: '/leads/kanban', icon: '⬦', label: 'Pipeline' },
  { to: '/roofing-quotes', icon: '🏠', label: 'Quotes' },
  { to: '/leads', icon: '☰', label: 'Leads' },
  { to: '/sites', icon: '⊡', label: 'Sites' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-secondary hover:text-white p-1"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.2em', color: '#E8E4DC' }}>// THE FORGE</span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in pb-20 sm:pb-6">
          <Outlet />
        </main>

        {/* Bottom tab bar — iPhone only (hidden sm and up) */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border flex z-40 safe-area-pb">
          {BOTTOM_NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[9px] font-medium tracking-wide transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`
              }
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

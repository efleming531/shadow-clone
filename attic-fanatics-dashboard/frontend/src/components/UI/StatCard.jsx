import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-bg-card border border-border rounded-xl p-4 animate-pulse">
    <div className="h-3 bg-border rounded w-24 mb-3" />
    <div className="h-6 bg-border rounded w-32" />
  </div>
);

export default function StatCard({ label, value, sub, highlight = false, loading = false }) {
  if (loading) return <SkeletonCard />;

  return (
    <div className={`bg-bg-card border rounded-xl p-4 transition-all hover:border-accent/30 hover:bg-bg-elevated ${highlight ? 'border-accent/40 bg-accent-muted' : 'border-border'}`}>
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-accent' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

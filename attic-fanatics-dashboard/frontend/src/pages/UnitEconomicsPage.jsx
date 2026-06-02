import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

function MetricCard({ label, value, sub, color = 'text-text-primary', format = 'default' }) {
  const display = format === 'currency' ? `$${(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` :
                  format === 'percent' ? `${((value || 0) * 100).toFixed(1)}%` :
                  format === 'x' ? `${(value || 0).toFixed(2)}x` :
                  format === 'days' ? `${(value || 0).toFixed(1)}d` :
                  format === 'months' ? `${(value || 0).toFixed(1)}mo` :
                  (value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{display}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function UnitEconomicsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/unit-economics')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load unit economics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>;
  }

  if (!data) return null;

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Unit Economics</h1>
        <p className="text-sm text-text-muted">Core business metrics — the health of your growth engine</p>
      </div>

      <div className="mb-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Customer Economics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="CAC" value={data.cac} format="currency" color="text-red-400" sub="Cost to acquire 1 customer" />
          <MetricCard label="LTV" value={data.ltv} format="currency" color="text-green-400" sub="Lifetime customer value (est.)" />
          <MetricCard label="LTV:CAC Ratio" value={data.ltvCacRatio} format="x" color={data.ltvCacRatio >= 3 ? 'text-green-400' : data.ltvCacRatio >= 1 ? 'text-yellow-400' : 'text-red-400'} sub="Target: 3x+" />
          <MetricCard label="Payback Period" value={data.paybackMonths} format="months" color={data.paybackMonths < 12 ? 'text-green-400' : 'text-yellow-400'} sub="Months to recover CAC" />
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Revenue Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="AOV" value={data.aov} format="currency" color="text-accent" sub="Avg order value" />
          <MetricCard label="MRR" value={data.mrr} format="currency" color="text-blue-400" sub="Monthly recurring revenue" />
          <MetricCard label="ARR" value={data.arr} format="currency" color="text-purple-400" sub="Annual recurring revenue" />
          <MetricCard label="ROAS" value={data.roas} format="x" color={data.roas >= 3 ? 'text-green-400' : 'text-yellow-400'} sub="Return on ad spend" />
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Efficiency Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="CPL" value={data.cpl} format="currency" color="text-text-primary" sub="Cost per lead" />
          <MetricCard label="Avg Sales Cycle" value={data.avgSalesCycle} format="days" color="text-text-primary" sub="Days from lead to close" />
          <MetricCard label="Total Revenue" value={data.totalRevenue} format="currency" color="text-accent" sub="All-time" />
          <MetricCard label="Customers" value={data.totalCustomers} color="text-text-primary" sub="Total customers" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">LTV:CAC Health</h3>
          <div className="space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${data.ltvCacRatio >= 3 ? 'text-green-400' : 'text-text-muted'}`}>
              <span>{data.ltvCacRatio >= 3 ? '✓' : '○'}</span><span>3x+ is healthy</span>
            </div>
            <div className={`flex items-center gap-2 ${data.ltvCacRatio >= 1 ? 'text-yellow-400' : 'text-text-muted'}`}>
              <span>{data.ltvCacRatio >= 1 ? '✓' : '○'}</span><span>1x+ means profitable</span>
            </div>
            <div className={`flex items-center gap-2 ${data.ltvCacRatio < 1 ? 'text-red-400' : 'text-text-muted'}`}>
              <span>{data.ltvCacRatio < 1 ? '✗' : '○'}</span><span>&lt;1x means losing money</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-text-muted mb-1"><span>0</span><span>3x (target)</span></div>
            <div className="w-full bg-bg-elevated rounded-full h-2">
              <div className={`h-full rounded-full transition-all ${data.ltvCacRatio >= 3 ? 'bg-green-400' : data.ltvCacRatio >= 1 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${Math.min(100, (data.ltvCacRatio / 3) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Revenue Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'One-time Jobs', value: data.totalRevenue - data.arr, color: 'bg-accent' },
              { label: 'Recurring (ARR)', value: data.arr, color: 'bg-blue-400' },
            ].map(item => {
              const pct = data.totalRevenue > 0 ? (item.value / data.totalRevenue) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">{item.label}</span>
                    <span className="text-text-primary">${Math.max(0, item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="w-full bg-bg-elevated rounded-full h-1.5">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(0, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Key Benchmarks</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'ROAS', current: data.roas, target: 4, fmt: (v) => `${v.toFixed(1)}x`, better: 'higher' },
              { label: 'CPL', current: data.cpl, target: 100, fmt: (v) => `$${v.toFixed(0)}`, better: 'lower' },
              { label: 'AOV', current: data.aov, target: 6000, fmt: (v) => `$${v.toFixed(0)}`, better: 'higher' },
            ].map(b => {
              const isGood = b.better === 'higher' ? b.current >= b.target : b.current <= b.target;
              return (
                <div key={b.label} className="flex items-center justify-between">
                  <span className="text-text-muted">{b.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={isGood ? 'text-green-400' : 'text-yellow-400'}>{b.fmt(b.current)}</span>
                    <span className="text-text-muted text-xs">/ target {b.fmt(b.target)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

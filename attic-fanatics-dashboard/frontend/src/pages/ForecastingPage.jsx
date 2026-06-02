import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STAGE_COLORS = {
  NEW: '#3b82f6',
  CONTACTED: '#8b5cf6',
  QUALIFIED: '#f59e0b',
  ESTIMATE_SENT: '#f97316',
  NEGOTIATING: '#ef4444',
};

export default function ForecastingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/forecasting')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load forecast data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>;
  }

  if (!data) return null;

  const fmtK = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Revenue Forecast</h1>
        <p className="text-sm text-text-muted">Weighted pipeline + historical trend projection</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pipeline Value', value: fmtK(data.pipelineValue), sub: 'Total open pipeline', color: 'text-blue-400' },
          { label: 'Weighted Pipeline', value: fmtK(data.weightedValue), sub: 'Probability-adjusted', color: 'text-purple-400' },
          { label: '30-Day Forecast', value: fmtK(data.projected30), sub: 'Based on trend', color: 'text-accent' },
          { label: '90-Day Forecast', value: fmtK(data.projected90), sub: '3-month projection', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-text-muted mb-0.5">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Revenue (Last 6 Months)</h3>
          {data.monthlyRevenue.some(m => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyRevenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, color: '#fff' }}
                  formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">No historical revenue data yet</div>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Pipeline by Stage</h3>
          {data.stageBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">No pipeline data yet</div>
          ) : (
            <div className="space-y-3">
              {data.stageBreakdown.map(s => (
                <div key={s.stage} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-text-muted flex-shrink-0">{s.stage.replace('_', ' ')}</div>
                  <div className="flex-1 bg-bg-elevated rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: data.pipelineValue > 0 ? `${(s.value / data.pipelineValue) * 100}%` : '0%',
                        backgroundColor: STAGE_COLORS[s.stage] || '#6b7280',
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 w-40 justify-end">
                    <span className="text-xs text-text-primary font-medium">{fmtK(s.value)}</span>
                    <span className="text-xs text-text-muted">×{(s.weight * 100).toFixed(0)}%</span>
                    <span className="text-xs text-accent font-medium w-14 text-right">{fmtK(s.value * s.weight)}</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Weighted total</span>
                  <span className="text-accent font-bold">{fmtK(data.weightedValue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">About This Forecast</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-text-secondary">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Pipeline Value</p>
            <p>Total estimated value of all active leads (not probability-adjusted).</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Weighted Value</p>
            <p>Pipeline adjusted by stage win probability: Negotiating 70%, Estimate Sent 50%, Qualified 30%, Contacted 15%, New 5%.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Trend Forecast</p>
            <p>30/90-day projections based on recent revenue growth rate vs. prior period.</p>
            {data.growthRate !== 0 && (
              <p className={`mt-1 font-semibold ${data.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Current trend: {data.growthRate >= 0 ? '+' : ''}{(data.growthRate * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STAGE_LABELS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  ESTIMATE_SENT: 'Est. Sent',
  NEGOTIATING: 'Negotiating',
};

const STAGE_COLORS = {
  NEW: '#3b82f6',
  CONTACTED: '#8b5cf6',
  QUALIFIED: '#f59e0b',
  ESTIMATE_SENT: '#f97316',
  NEGOTIATING: '#ef4444',
};

export default function VelocityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/velocity')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load velocity data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>;
  }

  if (!data) return null;

  const chartData = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    stage: label,
    days: parseFloat((data.avgDaysPerStage[key] || 0).toFixed(1)),
    fill: STAGE_COLORS[key],
  }));

  const stageData = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    key,
    label,
    count: data.stageCounts[key] || 0,
    avgDays: data.avgDaysPerStage[key] || 0,
    color: STAGE_COLORS[key],
  }));

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Pipeline Velocity</h1>
        <p className="text-sm text-text-muted">How fast leads move through your pipeline</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Leads', value: data.total, color: 'text-text-primary' },
          { label: 'Won', value: data.won, color: 'text-green-400' },
          { label: 'Lost', value: data.lost, color: 'text-red-400' },
          { label: 'Close Rate', value: `${(data.overallConversion * 100).toFixed(1)}%`, color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Avg Days Per Stage</h3>
          {chartData.some(d => d.days > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="stage" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} unit="d" />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, color: '#fff' }}
                  formatter={(v) => [`${v} days`, 'Avg Duration']}
                />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">
              Not enough data yet. Move leads through stages to see velocity.
            </div>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Pipeline Snapshot</h3>
          <div className="space-y-3">
            {stageData.map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <div className="w-24 text-xs text-text-muted flex-shrink-0">{s.label}</div>
                <div className="flex-1 bg-bg-elevated rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: data.total > 0 ? `${(s.count / data.total) * 100}%` : '0%',
                      backgroundColor: s.color,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-text-primary w-6 text-right">{s.count}</span>
                  <span className="text-xs text-text-muted">{s.avgDays.toFixed(1)}d avg</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Avg total cycle</span>
              <span className="text-text-primary font-semibold">{data.avgCycleDays.toFixed(1)} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

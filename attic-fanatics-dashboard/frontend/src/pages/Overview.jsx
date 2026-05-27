import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import StatCard, { SkeletonCard } from '../components/UI/StatCard';
import PeriodToggle from '../components/UI/PeriodToggle';
import FunnelChart from '../components/Charts/FunnelChart';
import { fmtCurrency, fmtPercent, fmtNumber, fmtDays, fmtX } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.name.includes('Rate') || p.name.includes('%') ? fmtPercent(p.value / 100) : fmtCurrency(p.value)}</p>
      ))}
    </div>
  );
};

export default function Overview() {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/overview?period=${period}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const m = data?.overall;

  const chartData = data?.sourceMetrics?.map(s => ({
    name: s.name,
    'Cost Per Lead': Math.round(s.cpl),
    'Close Rate %': parseFloat((s.closeRate * 100).toFixed(1)),
  })) || [];

  const cards = m ? [
    { label: 'Total Ad Spend', value: fmtCurrency(m.adSpend) },
    { label: 'Total Leads', value: fmtNumber(m.leadsGenerated) },
    { label: 'Cost Per Lead', value: fmtCurrency(m.cpl) },
    { label: 'CPM', value: fmtCurrency(m.cpm) },
    { label: 'Click Through Rate', value: fmtPercent(m.ctr) },
    { label: 'Form Completion Rate', value: fmtPercent(m.formCompletionRate) },
    { label: 'Calls Scheduled', value: fmtNumber(m.callsBooked) },
    { label: 'Show Rate', value: fmtPercent(m.showRate) },
    { label: 'Close Rate', value: fmtPercent(m.closeRate), highlight: true },
    { label: 'Install Rate', value: fmtPercent(m.installRate) },
    { label: 'Referral Rate', value: fmtPercent(m.referralRate) },
    { label: 'Avg Order Value', value: fmtCurrency(m.aov) },
    { label: 'Cost/Booked Inspection', value: fmtCurrency(m.costPerBookedInspection) },
    { label: 'Cost/Inspection', value: fmtCurrency(m.costPerInspection) },
    { label: 'Gross$/Booked Insp.', value: fmtCurrency(m.grossPerBookedInspection) },
    { label: 'Collected$/Booked Insp.', value: fmtCurrency(m.collectedPerBookedInspection) },
    { label: 'ROAS', value: fmtX(m.roas), highlight: true },
    { label: 'Avg Sales Cycle', value: fmtDays(m.avgSalesCycle) },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Overview Dashboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">Aggregate performance across all channels</p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {loading
          ? Array(18).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : cards.map(c => <StatCard key={c.label} {...c} />)
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Cost Per Lead vs Close Rate by Source</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-bg-elevated rounded-lg" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-text-secondary">
              <p>No data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Bar yAxisId="left" dataKey="Cost Per Lead" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Close Rate %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Overall Funnel Pipeline</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-bg-elevated rounded-lg" />
          ) : (
            <FunnelChart data={m} />
          )}
        </div>
      </div>
    </div>
  );
}

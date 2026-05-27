import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../utils/api';
import StatCard, { SkeletonCard } from '../components/UI/StatCard';
import PeriodToggle from '../components/UI/PeriodToggle';
import FunnelChart from '../components/Charts/FunnelChart';
import { fmtCurrency, fmtPercent, fmtNumber, fmtX } from '../utils/formatters';

const SOURCE_LABELS = {
  'google-ads': 'Google Ads',
  'facebook-instagram': 'Facebook / Instagram',
  'tiktok': 'TikTok',
  'organic': 'Organic',
  'referrals': 'Referrals',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {fmtNumber(p.value)}</p>
      ))}
    </div>
  );
};

export default function FunnelPage() {
  const { slug } = useParams();
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/funnel/${slug}?period=${period}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, period]);

  const m = data?.metrics;

  const qualityData = data?.qualityCounts
    ? Object.entries(data.qualityCounts).map(([k, v]) => ({ quality: k, count: v }))
    : [];

  const cards = m ? [
    { label: 'Ad Spend', value: fmtCurrency(m.adSpend) },
    { label: 'Leads', value: fmtNumber(m.leadsGenerated) },
    { label: 'Cost Per Lead', value: fmtCurrency(m.cpl) },
    { label: 'CPM', value: fmtCurrency(m.cpm) },
    { label: 'CTR', value: fmtPercent(m.ctr) },
    { label: 'Form Completion', value: fmtPercent(m.formCompletionRate) },
    { label: 'Calls Booked', value: fmtNumber(m.callsBooked) },
    { label: 'Show Rate', value: fmtPercent(m.showRate) },
    { label: 'Close Rate', value: fmtPercent(m.closeRate), highlight: true },
    { label: 'Avg Order Value', value: fmtCurrency(m.aov) },
    { label: 'ROAS', value: fmtX(m.roas), highlight: true },
    { label: 'Cost/Booked Insp.', value: fmtCurrency(m.costPerBookedInspection) },
    { label: 'Gross$/Booked Insp.', value: fmtCurrency(m.grossPerBookedInspection) },
    { label: 'Collected$/Booked', value: fmtCurrency(m.collectedPerBookedInspection) },
  ] : [];

  const timeData = data?.timeSeriesData?.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Leads: d.leadsGenerated,
    Booked: d.callsBooked,
    Closed: d.callsClosed,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{SOURCE_LABELS[slug] || slug}</h1>
          <p className="text-text-secondary text-sm mt-0.5">Funnel performance for this channel</p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {loading
          ? Array(14).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : cards.map(c => <StatCard key={c.label} {...c} />)
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Leads Over Time</h2>
          {loading ? (
            <div className="h-60 animate-pulse bg-bg-elevated rounded-lg" />
          ) : timeData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-text-secondary">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timeData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Line type="monotone" dataKey="Leads" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Booked" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Closed" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Conversion Funnel</h2>
          {loading ? (
            <div className="h-60 animate-pulse bg-bg-elevated rounded-lg" />
          ) : (
            <FunnelChart data={m} />
          )}
        </div>
      </div>

      {qualityData.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Lead Quality Summary</h2>
          <div className="flex gap-4 flex-wrap">
            {qualityData.map(q => (
              <div key={q.quality} className={`px-4 py-3 rounded-lg border text-center min-w-24 ${
                q.quality === 'HOT' ? 'bg-accent/10 border-accent/30 text-accent' :
                q.quality === 'WARM' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}>
                <p className="text-xl font-bold">{q.count}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mt-0.5">{q.quality}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

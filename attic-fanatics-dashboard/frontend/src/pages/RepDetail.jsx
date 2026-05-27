import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import StatCard, { SkeletonCard } from '../components/UI/StatCard';
import { fmtCurrency, fmtPercent, fmtNumber, fmtDays, fmtDate } from '../utils/formatters';

export default function RepDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sales/rep/${id}`)
      .then(res => setData(res.data))
      .catch(() => navigate('/sales'))
      .finally(() => setLoading(false));
  }, [id]);

  const s = data?.stats;
  const cards = s ? [
    { label: 'Total Revenue', value: fmtCurrency(s.totalRevenue), highlight: true },
    { label: '# of Deals', value: fmtNumber(s.numDeals) },
    { label: 'Install Rate', value: fmtPercent(s.installRate) },
    { label: 'Referral Rate', value: fmtPercent(s.referralRate) },
    { label: 'Avg Order Value', value: fmtCurrency(s.avgOrderValue) },
    { label: 'Avg Sales Cycle', value: fmtDays(s.avgSalesCycle) },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sales')} className="text-text-secondary hover:text-white transition-colors text-sm">← Back</button>
        <div>
          <h1 className="text-2xl font-black text-white">{loading ? '...' : data?.rep?.name}</h1>
          <p className="text-text-secondary text-sm">Sales Rep Performance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Revenue Trend</h2>
        {loading ? (
          <div className="h-48 animate-pulse bg-bg-elevated rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.trendData || []} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtCurrency(v)} contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Recent Deals</h2>
        {loading ? (
          <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-10 animate-pulse bg-bg-elevated rounded" />)}</div>
        ) : data?.recentDeals?.length === 0 ? (
          <p className="text-text-secondary text-sm">No deals found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {['Date', 'Revenue', 'Collected', 'Installed', 'Referral', 'Cycle'].map(h => (
                    <th key={h} className="pb-3 pr-4 text-xs text-text-secondary uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentDeals.map(deal => (
                  <tr key={deal.id} className="border-b border-border/50">
                    <td className="py-2.5 pr-4 text-text-secondary">{fmtDate(deal.date)}</td>
                    <td className="py-2.5 pr-4 font-semibold text-accent">{fmtCurrency(deal.revenue)}</td>
                    <td className="py-2.5 pr-4">{fmtCurrency(deal.cashCollected)}</td>
                    <td className="py-2.5 pr-4">{deal.installed ? <span className="text-green-400">✓</span> : <span className="text-text-muted">—</span>}</td>
                    <td className="py-2.5 pr-4">{deal.referralGenerated ? <span className="text-blue-400">✓</span> : <span className="text-text-muted">—</span>}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{fmtDays(deal.salesCycleDays)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

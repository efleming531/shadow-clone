import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../utils/api';
import StatCard, { SkeletonCard } from '../components/UI/StatCard';
import { fmtPercent, fmtNumber, fmtMinutes } from '../utils/formatters';

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/call-center/agent/${id}`)
      .then(res => setData(res.data))
      .catch(() => navigate('/call-center'))
      .finally(() => setLoading(false));
  }, [id]);

  const s = data?.stats;
  const cards = s ? [
    { label: 'Total Leads', value: fmtNumber(s.totalLeads) },
    { label: 'Speed to Lead', value: fmtMinutes(s.speedToLead) },
    { label: 'Answer Rate', value: fmtPercent(s.answerRate) },
    { label: 'Qualified Rate', value: fmtPercent(s.qualifiedRate) },
    { label: 'Booked Rate', value: fmtPercent(s.bookedRate), highlight: true },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/call-center')} className="text-text-secondary hover:text-white transition-colors text-sm">← Back</button>
        <div>
          <h1 className="text-2xl font-black text-white">{loading ? '...' : data?.agent?.name}</h1>
          <p className="text-text-secondary text-sm">Call Center Agent Performance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />) : cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Daily Activity</h2>
        {loading ? (
          <div className="h-48 animate-pulse bg-bg-elevated rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.trendData || []} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Line type="monotone" dataKey="leads" stroke="#f97316" strokeWidth={2} dot={false} name="Leads" />
              <Line type="monotone" dataKey="booked" stroke="#22c55e" strokeWidth={2} dot={false} name="Booked" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

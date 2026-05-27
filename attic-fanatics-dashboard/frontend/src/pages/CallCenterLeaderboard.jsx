import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SortableTable from '../components/UI/SortableTable';
import { fmtPercent, fmtNumber, fmtMinutes } from '../utils/formatters';

const PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'ytd', label: 'Year to Date' },
];

export default function CallCenterLeaderboard() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get(`/call-center/leaderboard?period=${period}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const columns = [
    { key: 'name', label: 'Agent Name', render: v => <span className="font-semibold text-white">{v}</span> },
    { key: 'speedToLead', label: 'Speed to Lead', render: v => <span className={v < 10 ? 'text-green-400 font-semibold' : v < 20 ? 'text-yellow-400' : 'text-red-400'}>{fmtMinutes(v)}</span> },
    { key: 'totalLeads', label: 'Total Leads', render: v => fmtNumber(v) },
    { key: 'answerRate', label: 'Answer Rate', render: v => <span className={v > 0.85 ? 'text-green-400' : 'text-text-primary'}>{fmtPercent(v)}</span> },
    { key: 'qualifiedRate', label: 'Qualified Rate', render: v => <span className={v > 0.65 ? 'text-green-400' : 'text-text-primary'}>{fmtPercent(v)}</span> },
    { key: 'bookedRate', label: 'Booked Rate', render: v => <span className={`font-bold ${v > 0.50 ? 'text-accent' : 'text-text-primary'}`}>{fmtPercent(v)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Call Center Leaderboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">Click an agent to view their detail page</p>
        </div>
        <div className="flex items-center gap-1 bg-bg-card border border-border rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === p.value ? 'bg-accent text-white' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-14 animate-pulse bg-bg-card border border-border rounded-xl" />)}</div>
      ) : (
        <SortableTable
          columns={columns}
          data={data}
          onRowClick={row => navigate(`/call-center/agent/${row.id}`)}
          emptyMessage="No call center data for this period."
        />
      )}
    </div>
  );
}

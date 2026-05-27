import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SortableTable from '../components/UI/SortableTable';
import { fmtCurrency, fmtNumber } from '../utils/formatters';

const PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'ytd', label: 'Year to Date' },
];

export default function SalesLeaderboard() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get(`/sales/leaderboard?period=${period}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const columns = [
    { key: 'rank', label: 'Rank', sortable: false, render: (v) => (
      <span className={`font-black text-lg ${v === 1 ? 'text-yellow-400' : v === 2 ? 'text-gray-300' : v === 3 ? 'text-amber-600' : 'text-text-muted'}`}>
        {v === 1 ? '🥇' : v === 2 ? '🥈' : v === 3 ? '🥉' : `#${v}`}
      </span>
    )},
    { key: 'name', label: 'Rep Name', render: (v) => <span className="font-semibold text-white">{v}</span> },
    { key: 'totalSales', label: 'Total Sales', render: (v) => <span className="font-bold text-accent">{fmtCurrency(v)}</span> },
    { key: 'numDeals', label: '# Deals', render: (v) => fmtNumber(v) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Sales Leaderboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">Click a rep to view their detail page</p>
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
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-14 animate-pulse bg-bg-card border border-border rounded-xl" />
          ))}
        </div>
      ) : (
        <SortableTable
          columns={columns}
          data={data}
          onRowClick={row => navigate(`/sales/rep/${row.id}`)}
          emptyMessage="No sales data for this period. Add deals in Data Entry."
        />
      )}
    </div>
  );
}

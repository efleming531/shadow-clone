import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  DRAFT: 'bg-gray-500/15 text-gray-400',
  PENDING_REVIEW: 'bg-yellow-500/15 text-yellow-400',
  ESCALATED: 'bg-red-500/15 text-red-400',
  APPROVED: 'bg-green-500/15 text-green-400',
  SENT: 'bg-blue-500/15 text-blue-400',
  ACCEPTED: 'bg-emerald-500/15 text-emerald-400',
  DECLINED: 'bg-red-500/15 text-red-400',
};

function fmtCurrency(n) {
  if (!n) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export default function RoofingQuotesList() {
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEscalated, setFilterEscalated] = useState('');
  const { canManageData, isOwner } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, [filterStatus, filterEscalated]);

  async function loadAll() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterEscalated) params.set('escalated', filterEscalated);
      const [qRes, sRes] = await Promise.all([
        api.get(`/roofing-quotes?${params}`),
        api.get('/roofing-quotes/stats'),
      ]);
      setQuotes(qRes.data);
      setStats(sRes.data);
    } catch {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(q, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete quote ${q.number}?`)) return;
    try {
      await api.delete(`/roofing-quotes/${q.id}`);
      toast.success('Quote deleted');
      loadAll();
    } catch { toast.error('Failed to delete'); }
  }

  const statTiles = stats ? [
    { label: 'Total Quotes', value: stats.total, accent: false },
    { label: 'Total Value', value: `$${(stats.totalValue || 0).toLocaleString()}`, accent: true },
    ...(stats.byStatus || []).map(s => ({ label: s.status.replace(/_/g, ' '), value: s._count, accent: false })),
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Forge Roofing Quotes</h1>
          <p className="text-sm text-text-muted mt-0.5">AI-powered measurement analysis + escalation workflow</p>
        </div>
        {canManageData && (
          <Link to="/roofing-quotes/new" className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New Quote
          </Link>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-3 flex-wrap">
          <div className="bg-bg-card border border-border rounded-xl px-5 py-3">
            <p className="text-xs text-text-muted">Total Quotes</p>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          </div>
          <div className="bg-bg-card border border-border rounded-xl px-5 py-3">
            <p className="text-xs text-text-muted">Total Value</p>
            <p className="text-2xl font-bold text-accent">${(stats.totalValue || 0).toLocaleString()}</p>
          </div>
          {(stats.byStatus || []).map(s => (
            <div key={s.status} className="bg-bg-card border border-border rounded-xl px-5 py-3">
              <p className="text-xs text-text-muted">{s.status.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-bold text-text-primary">{s._count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="forge-input text-sm w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['DRAFT','PENDING_REVIEW','ESCALATED','APPROVED','SENT','ACCEPTED','DECLINED'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select className="forge-input text-sm w-44" value={filterEscalated} onChange={e => setFilterEscalated(e.target.value)}>
          <option value="">All</option>
          <option value="true">Escalated Only</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-14 bg-bg-card rounded-xl animate-pulse border border-border" />)}
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-text-primary font-semibold">No roofing quotes yet</p>
          <p className="text-text-muted text-sm mt-1">Create your first quote to get started</p>
          {canManageData && (
            <Link to="/roofing-quotes/new" className="inline-block mt-4 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              + New Quote
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="table-scroll">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Quote #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Property</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Material</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Squares</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Flags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Created By</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map(q => (
                <tr
                  key={q.id}
                  onClick={() => navigate(`/roofing-quotes/${q.id}`)}
                  className="hover:bg-bg-elevated transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 font-mono text-accent font-semibold">{q.number}</td>
                  <td className="px-4 py-3 text-text-primary max-w-[200px]">
                    <p className="truncate">{q.propStreet || q.propertyAddress || <span className="text-text-muted italic">No address</span>}</p>
                    {(q.propCity || q.propState) && <p className="text-xs text-text-muted">{[q.propCity, q.propState, q.propZip].filter(Boolean).join(', ')}</p>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{q.materialType}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{q.adjustedSquares?.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-text-primary">${(q.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[q.status] || 'bg-gray-500/15 text-gray-400'}`}>
                      {q.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {q.escalated ? (
                      <span title={Array.isArray(q.escalationReasons) ? q.escalationReasons.join('\n') : ''} className="text-red-400 text-base cursor-help">⚠</span>
                    ) : (
                      <span className="text-green-500 text-sm">✓</span>
                    )}
                    {q.aiConfidence !== null && q.aiConfidence !== undefined && (
                      <span className={`ml-1 text-[10px] ${q.aiConfidence >= 70 ? 'text-text-muted' : 'text-red-400'}`}>
                        {q.aiConfidence}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">{q.createdBy?.name}</td>
                  <td className="px-4 py-3 text-right">
                    {canManageData && (
                      <button
                        onClick={e => handleDelete(q, e)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all text-xs px-2 py-1 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

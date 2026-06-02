import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const STAGE_COLORS = {
  NEW: 'bg-blue-500/15 text-blue-400',
  CONTACTED: 'bg-purple-500/15 text-purple-400',
  QUALIFIED: 'bg-yellow-500/15 text-yellow-400',
  ESTIMATE_SENT: 'bg-orange-500/15 text-orange-400',
  NEGOTIATING: 'bg-red-500/15 text-red-400',
  WON: 'bg-green-500/15 text-green-400',
  LOST: 'bg-gray-500/15 text-gray-400',
  UNQUALIFIED: 'bg-gray-700/30 text-gray-500',
};

export default function LeadsListPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(loadLeads, 300);
    return () => clearTimeout(t);
  }, [stageFilter, search]);

  async function loadLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stageFilter) params.append('stage', stageFilter);
      if (search) params.append('search', search);
      const r = await api.get(`/leads?${params}`);
      setLeads(r.data);
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">All Leads</h1>
          <p className="text-sm text-text-muted">{leads.length} leads</p>
        </div>
        <Link to="/leads/kanban" className="text-sm text-text-secondary hover:text-text-primary transition-colors border border-border px-3 py-1.5 rounded-lg">
          Kanban View
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input className="forge-input max-w-sm" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." />
        <select className="forge-input w-40" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="">All Stages</option>
          {['NEW', 'CONTACTED', 'QUALIFIED', 'ESTIMATE_SENT', 'NEGOTIATING', 'WON', 'LOST', 'UNQUALIFIED'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-bg-card rounded-lg border border-border animate-pulse" />)}</div>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Stage', 'Source', 'Location', 'Est. Value', 'Rep', 'Created'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-text-muted py-12 text-sm">No leads found</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/leads/${l.id}`} className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">{l.name}</Link>
                    {l.phone && <p className="text-xs text-text-muted">{l.phone}</p>}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[l.stage]}`}>{l.stage.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{l.leadSource?.name}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{l.city ? `${l.city}, ${l.state}` : '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-accent">{l.estimatedValue ? `$${l.estimatedValue.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{l.assignedRep?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

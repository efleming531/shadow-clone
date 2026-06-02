import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-500/15 text-gray-400',
  SENT: 'bg-blue-500/15 text-blue-400',
  ACCEPTED: 'bg-green-500/15 text-green-400',
  DECLINED: 'bg-red-500/15 text-red-400',
  EXPIRED: 'bg-yellow-500/15 text-yellow-400',
};

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { canManageData } = useAuth();

  useEffect(() => {
    loadEstimates();
  }, [statusFilter]);

  async function loadEstimates() {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const r = await api.get(`/estimates${params}`);
      setEstimates(r.data);
    } catch {
      toast.error('Failed to load estimates');
    } finally {
      setLoading(false);
    }
  }

  const totalValue = estimates.reduce((s, e) => s + e.total, 0);
  const acceptedValue = estimates.filter(e => e.status === 'ACCEPTED').reduce((s, e) => s + e.total, 0);

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Estimates</h1>
          <p className="text-sm text-text-muted">{estimates.length} estimates · ${totalValue.toLocaleString()} total · ${acceptedValue.toLocaleString()} accepted</p>
        </div>
        {canManageData && (
          <Link to="/estimates/new" className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New Estimate
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${statusFilter === s ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-bg-card rounded-lg border border-border animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">Number</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">Lead</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">Created By</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {estimates.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-text-muted py-12 text-sm">No estimates found</td></tr>
              ) : estimates.map(e => (
                <tr key={e.id} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/estimates/${e.id}`} className="text-sm font-semibold text-accent hover:text-accent-hover">{e.number}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {e.lead ? (
                      <Link to={`/leads/${e.lead.id}`} className="text-sm text-text-primary hover:text-accent">{e.lead.name}</Link>
                    ) : <span className="text-sm text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-text-primary">${e.total.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{e.createdBy?.name}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

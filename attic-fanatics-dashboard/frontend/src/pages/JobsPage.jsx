import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-500/15 text-blue-400',
  IN_PROGRESS: 'bg-yellow-500/15 text-yellow-400',
  COMPLETED: 'bg-green-500/15 text-green-400',
  ON_HOLD: 'bg-orange-500/15 text-orange-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [reps, setReps] = useState([]);
  const [form, setForm] = useState({ customerId: '', serviceType: '', scheduledDate: '', totalRevenue: '', assignedRepId: '', description: '' });
  const { canManageData } = useAuth();

  useEffect(() => { loadJobs(); loadStats(); }, [statusFilter]);

  async function loadJobs() {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const r = await api.get(`/jobs${params}`);
      setJobs(r.data);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  }

  async function loadStats() {
    try {
      const r = await api.get('/jobs/stats');
      setStats(r.data);
    } catch {}
  }

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data)).catch(() => {});
    api.get('/sales/leaderboard').then(r => setReps(r.data?.reps || r.data || [])).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/jobs', form);
      toast.success('Job created');
      setShowNewModal(false);
      setForm({ customerId: '', serviceType: '', scheduledDate: '', totalRevenue: '', assignedRepId: '', description: '' });
      loadJobs(); loadStats();
    } catch { toast.error('Failed to create job'); }
  }

  const SERVICE_TYPES = ['Blown-in Insulation', 'Rodent Exclusion', 'Full Attic Restoration', 'Vapor Barrier Install', 'Air Sealing', 'Inspection', 'Cleanup'];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Jobs</h1>
          {stats && <p className="text-sm text-text-muted">${stats.totalRevenue.toLocaleString()} total revenue · {stats.total} jobs</p>}
        </div>
        {canManageData && (
          <button onClick={() => setShowNewModal(true)} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ New Job</button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-400' },
            { label: 'Completed', value: stats.completed, color: 'text-green-400' },
            { label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, color: 'text-accent' },
          ].map(s => (
            <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'].map(s => (
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
        <div className="space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-bg-card rounded-lg border border-border animate-pulse" />)}</div>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Job #', 'Customer', 'Service', 'Status', 'Scheduled', 'Revenue', 'Rep'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-text-muted py-12 text-sm">No jobs found</td></tr>
              ) : jobs.map(j => (
                <tr key={j.id} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3"><Link to={`/jobs/${j.id}`} className="text-sm font-semibold text-accent hover:text-accent-hover">{j.jobNumber}</Link></td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-text-primary">{j.customer?.name}</p>
                      <p className="text-xs text-text-muted">{j.customer?.city}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{j.serviceType}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[j.status]}`}>{j.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-sm text-text-muted">{j.scheduledDate ? new Date(j.scheduledDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary">${j.totalRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{j.assignedRep?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewModal && (
        <Modal title="New Job" onClose={() => setShowNewModal(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Customer *</label>
              <select className="forge-input" required value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Service Type *</label>
              <select className="forge-input" required value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}>
                <option value="">Select service...</option>
                {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Scheduled Date</label>
                <input className="forge-input" type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Revenue ($)</label>
                <input className="forge-input" type="number" min="0" value={form.totalRevenue} onChange={e => setForm(f => ({ ...f, totalRevenue: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Assigned Rep</label>
              <select className="forge-input" value={form.assignedRepId} onChange={e => setForm(f => ({ ...f, assignedRepId: e.target.value }))}>
                <option value="">Unassigned</option>
                {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Create Job</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

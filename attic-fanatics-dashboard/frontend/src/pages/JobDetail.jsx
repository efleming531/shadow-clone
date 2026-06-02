import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-500/15 text-blue-400',
  IN_PROGRESS: 'bg-yellow-500/15 text-yellow-400',
  COMPLETED: 'bg-green-500/15 text-green-400',
  ON_HOLD: 'bg-orange-500/15 text-orange-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageData } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { loadJob(); }, [id]);

  async function loadJob() {
    setLoading(true);
    try {
      const r = await api.get(`/jobs/${id}`);
      setJob(r.data);
      setForm({
        status: r.data.status,
        scheduledDate: r.data.scheduledDate ? r.data.scheduledDate.split('T')[0] : '',
        completedDate: r.data.completedDate ? r.data.completedDate.split('T')[0] : '',
        totalRevenue: r.data.totalRevenue,
        cashCollected: r.data.cashCollected,
        notes: r.data.notes || '',
      });
    } catch {
      toast.error('Job not found');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      await api.patch(`/jobs/${id}`, form);
      toast.success('Job updated');
      setEditing(false);
      loadJob();
    } catch {
      toast.error('Failed to update job');
    }
  }

  if (loading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>;
  }

  if (!job) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link to="/jobs" className="hover:text-text-primary transition-colors">Jobs</Link>
        <span>›</span>
        <span className="text-text-primary">{job.jobNumber}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{job.jobNumber}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>{job.status.replace('_', ' ')}</span>
            <span className="text-sm text-text-muted">{job.serviceType}</span>
          </div>
        </div>
        {canManageData && (
          editing
            ? <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm bg-bg-elevated border border-border text-text-secondary rounded-lg hover:text-text-primary transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors">Save</button>
              </div>
            : <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm bg-bg-elevated border border-border text-text-secondary rounded-lg hover:text-text-primary transition-colors">Edit</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Job Details</h3>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Status</label>
                  <select className="forge-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Scheduled</label>
                    <input className="forge-input" type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Completed</label>
                    <input className="forge-input" type="date" value={form.completedDate} onChange={e => setForm(f => ({ ...f, completedDate: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Revenue ($)</label>
                    <input className="forge-input" type="number" value={form.totalRevenue} onChange={e => setForm(f => ({ ...f, totalRevenue: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Collected ($)</label>
                    <input className="forge-input" type="number" value={form.cashCollected} onChange={e => setForm(f => ({ ...f, cashCollected: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Notes</label>
                  <textarea className="forge-input resize-none" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-text-muted">Scheduled</span><span className="text-text-primary">{fmtDate(job.scheduledDate)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Completed</span><span className="text-text-primary">{fmtDate(job.completedDate)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Revenue</span><span className="text-text-primary font-semibold">${job.totalRevenue.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Collected</span><span className="text-green-400 font-semibold">${job.cashCollected.toLocaleString()}</span></div>
                {job.notes && <div className="pt-2 text-sm text-text-secondary border-t border-border">{job.notes}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Customer</h3>
            {job.customer ? (
              <div className="space-y-2">
                <Link to={`/customers/${job.customer.id}`} className="text-sm font-semibold text-accent hover:text-accent-hover">{job.customer.name}</Link>
                {job.customer.phone && <p className="text-sm text-text-secondary">{job.customer.phone}</p>}
                {job.customer.email && <p className="text-sm text-text-secondary">{job.customer.email}</p>}
                {job.customer.city && <p className="text-sm text-text-muted">{job.customer.city}, {job.customer.state} {job.customer.zip}</p>}
                {job.customer.address && <p className="text-sm text-text-muted">{job.customer.address}</p>}
              </div>
            ) : <p className="text-sm text-text-muted">No customer linked</p>}
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Assigned Rep</h3>
            {job.assignedRep ? (
              <p className="text-sm text-text-primary">{job.assignedRep.name}</p>
            ) : <p className="text-sm text-text-muted">Unassigned</p>}
          </div>

          {job.lead && (
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">From Lead</h3>
              <Link to={`/leads/${job.lead.id}`} className="text-sm text-accent hover:text-accent-hover">{job.lead.name}</Link>
              <span className="text-xs text-text-muted ml-2">{job.lead.stage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

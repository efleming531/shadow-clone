import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  EXPIRED: 'bg-gray-500/15 text-gray-400',
  PAUSED: 'bg-yellow-500/15 text-yellow-400',
};

export default function MembershipPage() {
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [enrollForm, setEnrollForm] = useState({ customerId: '', planId: '', startDate: new Date().toISOString().split('T')[0] });
  const [planForm, setPlanForm] = useState({ name: '', price: '', billingCycle: 'MONTHLY', features: '' });
  const { isOwner, canManageData } = useAuth();

  useEffect(() => { loadAll(); }, [statusFilter]);

  async function loadAll() {
    setLoading(true);
    try {
      const [statsR, membersR, plansR] = await Promise.all([
        api.get('/membership/stats'),
        api.get(`/membership/members?status=${statusFilter}`),
        api.get('/membership/plans'),
      ]);
      setStats(statsR.data);
      setMembers(membersR.data);
      setPlans(plansR.data);
    } catch { toast.error('Failed to load membership data'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data)).catch(() => {});
  }, []);

  async function handleEnroll(e) {
    e.preventDefault();
    try {
      await api.post('/membership/enroll', enrollForm);
      toast.success('Customer enrolled');
      setShowEnrollModal(false);
      setEnrollForm({ customerId: '', planId: '', startDate: new Date().toISOString().split('T')[0] });
      loadAll();
    } catch { toast.error('Failed to enroll customer'); }
  }

  async function handleCreatePlan(e) {
    e.preventDefault();
    try {
      await api.post('/membership/plans', {
        ...planForm,
        features: planForm.features.split('\n').filter(Boolean),
      });
      toast.success('Plan created');
      setShowPlanModal(false);
      setPlanForm({ name: '', price: '', billingCycle: 'MONTHLY', features: '' });
      loadAll();
    } catch { toast.error('Failed to create plan'); }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this membership?')) return;
    try {
      await api.patch(`/membership/${id}/cancel`);
      toast.success('Membership cancelled');
      loadAll();
    } catch { toast.error('Failed to cancel membership'); }
  }

  if (loading && !stats) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>;
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Membership</h1>
        <div className="flex gap-2">
          {isOwner && <button onClick={() => setShowPlanModal(true)} className="px-3 py-1.5 text-sm bg-bg-elevated border border-border text-text-secondary hover:text-text-primary rounded-lg transition-colors">+ New Plan</button>}
          {canManageData && <button onClick={() => setShowEnrollModal(true)} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ Enroll Member</button>}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'MRR', value: `$${stats.mrr.toFixed(0)}`, sub: 'Monthly Recurring', color: 'text-accent' },
            { label: 'Active', value: stats.activeCount, sub: 'Active members', color: 'text-green-400' },
            { label: 'ARR', value: `$${(stats.mrr * 12).toFixed(0)}`, sub: 'Annual recurring', color: 'text-blue-400' },
            { label: 'Churn', value: `${(stats.churnRate * 100).toFixed(1)}%`, sub: 'Churn rate', color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-0.5">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {plans.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text-secondary mb-3">Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p.id} className="bg-bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">{p.name}</p>
                    <p className="text-accent text-lg font-bold mt-1">${p.price}<span className="text-xs text-text-muted font-normal">/{p.billingCycle.toLowerCase()}</span></p>
                  </div>
                  <span className="text-xs text-text-muted bg-bg-elevated px-2 py-1 rounded">{p._count?.memberships || 0} members</span>
                </div>
                <ul className="mt-3 space-y-1">
                  {p.features.map((f, i) => <li key={i} className="text-xs text-text-secondary flex items-center gap-1.5"><span className="text-green-400">✓</span>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-secondary">Members</h2>
        <div className="flex gap-2">
          {['ACTIVE', 'CANCELLED', 'EXPIRED', 'PAUSED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-2 py-1 text-xs font-medium rounded border transition-all ${statusFilter === s ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Customer', 'Plan', 'Status', 'Started', 'Renewal', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8"><div className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" /></td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-text-muted py-10 text-sm">No {statusFilter.toLowerCase()} members</td></tr>
            ) : members.map(m => (
              <tr key={m.id} className="hover:bg-bg-elevated transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-text-primary">{m.customer.name}</p>
                  <p className="text-xs text-text-muted">{m.customer.phone}</p>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">{m.plan.name}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status]}`}>{m.status}</span></td>
                <td className="px-4 py-3 text-sm text-text-muted">{new Date(m.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{m.renewalDate ? new Date(m.renewalDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  {m.status === 'ACTIVE' && canManageData && (
                    <button onClick={() => handleCancel(m.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEnrollModal && (
        <Modal title="Enroll Member" onClose={() => setShowEnrollModal(false)}>
          <form onSubmit={handleEnroll} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Customer *</label>
              <select className="forge-input" required value={enrollForm.customerId} onChange={e => setEnrollForm(f => ({ ...f, customerId: e.target.value }))}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Plan *</label>
              <select className="forge-input" required value={enrollForm.planId} onChange={e => setEnrollForm(f => ({ ...f, planId: e.target.value }))}>
                <option value="">Select plan...</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}/{p.billingCycle.toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Start Date</label>
              <input className="forge-input" type="date" value={enrollForm.startDate} onChange={e => setEnrollForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowEnrollModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Enroll</button>
            </div>
          </form>
        </Modal>
      )}

      {showPlanModal && (
        <Modal title="New Membership Plan" onClose={() => setShowPlanModal(false)}>
          <form onSubmit={handleCreatePlan} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Plan Name *</label>
              <input className="forge-input" required value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Attic Shield Basic" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Price ($) *</label>
                <input className="forge-input" type="number" required min="0" step="0.01" value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Billing Cycle</label>
                <select className="forge-input" value={planForm.billingCycle} onChange={e => setPlanForm(f => ({ ...f, billingCycle: e.target.value }))}>
                  <option>MONTHLY</option><option>QUARTERLY</option><option>ANNUAL</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Features (one per line)</label>
              <textarea className="forge-input resize-none" rows={4} value={planForm.features} onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))} placeholder="Annual inspection&#10;Priority scheduling&#10;10% off services" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowPlanModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Create Plan</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const METRICS = [
  { value: 'cpl', label: 'CPL (Cost Per Lead)' },
  { value: 'close_rate', label: 'Close Rate' },
  { value: 'revenue', label: 'Daily Revenue' },
  { value: 'leads', label: 'Daily Leads' },
];

export default function AlertsPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', metric: 'cpl', condition: 'above', threshold: '', period: 'daily' });
  const { canManageData, isOwner } = useAuth();

  useEffect(() => { loadRules(); }, []);

  async function loadRules() {
    setLoading(true);
    try {
      const r = await api.get('/alerts');
      setRules(r.data);
    } catch { toast.error('Failed to load alerts'); }
    finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/alerts/${editing.id}`, form);
        toast.success('Alert updated');
      } else {
        await api.post('/alerts', form);
        toast.success('Alert created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', metric: 'cpl', condition: 'above', threshold: '', period: 'daily' });
      loadRules();
    } catch { toast.error('Failed to save alert'); }
  }

  async function handleToggle(rule) {
    try {
      await api.patch(`/alerts/${rule.id}`, { isActive: !rule.isActive });
      toast.success(rule.isActive ? 'Alert disabled' : 'Alert enabled');
      loadRules();
    } catch { toast.error('Failed to toggle alert'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this alert rule?')) return;
    try {
      await api.delete(`/alerts/${id}`);
      toast.success('Alert deleted');
      loadRules();
    } catch { toast.error('Failed to delete alert'); }
  }

  function openEdit(rule) {
    setEditing(rule);
    setForm({ name: rule.name, metric: rule.metric, condition: rule.condition, threshold: rule.threshold, period: rule.period });
    setShowModal(true);
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Alerts</h1>
          <p className="text-sm text-text-muted">Get notified when KPIs drop below thresholds</p>
        </div>
        {canManageData && (
          <button onClick={() => { setEditing(null); setForm({ name: '', metric: 'cpl', condition: 'above', threshold: '', period: 'daily' }); setShowModal(true); }} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New Alert
          </button>
        )}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
        <p className="text-xs text-text-muted">Alerts are checked <span className="text-text-primary font-medium">hourly</span>. When a metric crosses a threshold, it is logged to the server console. In a future update, alerts will be sent via email or SMS.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">No alert rules configured</div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => (
            <div key={r.id} className={`bg-bg-card border rounded-xl p-4 flex items-center justify-between ${r.isActive ? 'border-border' : 'border-border opacity-60'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${r.isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="font-semibold text-text-primary">{r.name}</p>
                  <p className="text-sm text-text-secondary">
                    Alert when <span className="text-accent">{METRICS.find(m => m.value === r.metric)?.label || r.metric}</span> is{' '}
                    <span className="text-text-primary">{r.condition}</span>{' '}
                    <span className="text-accent font-semibold">{r.metric === 'close_rate' ? `${(r.threshold * 100).toFixed(0)}%` : r.metric === 'cpl' ? `$${r.threshold}` : r.threshold}</span>
                    {' '}({r.period})
                  </p>
                  {r.lastFired && <p className="text-xs text-yellow-400 mt-0.5">Last fired: {new Date(r.lastFired).toLocaleString()}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManageData && (
                  <>
                    <button onClick={() => openEdit(r)} className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1">Edit</button>
                    <button onClick={() => handleToggle(r)} className={`text-xs px-2 py-1 rounded border transition-colors ${r.isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
                      {r.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </>
                )}
                {isOwner && (
                  <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Alert' : 'New Alert Rule'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Alert Name *</label>
              <input className="forge-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. CPL Too High" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Metric</label>
                <select className="forge-input" value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
                  {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Condition</label>
                <select className="forge-input" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Threshold {form.metric === 'close_rate' ? '(0-1, e.g. 0.25)' : ''}</label>
                <input className="forge-input" type="number" required step="any" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} placeholder={form.metric === 'close_rate' ? '0.25' : '150'} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Period</label>
                <select className="forge-input" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

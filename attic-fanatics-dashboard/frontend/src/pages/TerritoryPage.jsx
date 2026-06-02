import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const STATE_COLORS = { NJ: 'text-blue-400', NY: 'text-purple-400', PA: 'text-green-400' };

export default function TerritoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ zipCode: '', city: '', state: 'NJ', dealCount: '', revenue: '', leadCount: '' });
  const { isOwner } = useAuth();

  useEffect(() => { loadData(); }, [stateFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = stateFilter ? `?state=${stateFilter}` : '';
      const r = await api.get(`/territory${params}`);
      setData(r.data);
    } catch { toast.error('Failed to load territory data'); }
    finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await api.post('/territory', form);
      toast.success('Territory added');
      setShowAddModal(false);
      setForm({ zipCode: '', city: '', state: 'NJ', dealCount: '', revenue: '', leadCount: '' });
      loadData();
    } catch { toast.error('Failed to add territory'); }
  }

  const maxRevenue = data?.territories.reduce((m, t) => Math.max(m, t.revenue), 0) || 1;

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Territory</h1>
          <p className="text-sm text-text-muted">Revenue and deal density by ZIP code</p>
        </div>
        {isOwner && <button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ Add ZIP</button>}
      </div>

      {data?.totals && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Revenue', value: `$${data.totals.revenue.toLocaleString()}`, color: 'text-accent' },
            { label: 'Total Deals', value: data.totals.dealCount, color: 'text-green-400' },
            { label: 'Total Leads', value: data.totals.leadCount, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['', 'NJ', 'NY', 'PA'].map(s => (
          <button key={s} onClick={() => setStateFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${stateFilter === s ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'}`}>
            {s || 'All States'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-bg-card rounded-lg border border-border animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.territories.length === 0 ? (
            <p className="col-span-3 text-center py-10 text-text-muted text-sm">No territory data found</p>
          ) : data?.territories.map(t => (
            <div key={t.id} className="bg-bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-text-primary">{t.city}</p>
                  <p className="text-xs text-text-muted">{t.zipCode} · <span className={STATE_COLORS[t.state] || 'text-text-muted'}>{t.state}</span></p>
                </div>
                <span className="text-accent font-bold text-sm">${t.revenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-bg-elevated rounded-full h-1.5 mb-2">
                <div className="h-full bg-accent rounded-full" style={{ width: `${(t.revenue / maxRevenue) * 100}%` }} />
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>{t.dealCount} deals</span>
                <span>{t.leadCount} leads</span>
                {t.dealCount > 0 && <span>${(t.revenue / t.dealCount).toFixed(0)} avg</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <Modal title="Add Territory" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">ZIP Code *</label>
                <input className="forge-input" required value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} placeholder="07101" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">City *</label>
                <input className="forge-input" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Newark" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">State</label>
              <select className="forge-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                <option>NJ</option><option>NY</option><option>PA</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Deals</label>
                <input className="forge-input" type="number" min="0" value={form.dealCount} onChange={e => setForm(f => ({ ...f, dealCount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Revenue ($)</label>
                <input className="forge-input" type="number" min="0" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Leads</label>
                <input className="forge-input" type="number" min="0" value={form.leadCount} onChange={e => setForm(f => ({ ...f, leadCount: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Add</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

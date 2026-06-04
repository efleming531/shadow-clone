import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', state: 'NJ', zip: '' });
  const { canManageData } = useAuth();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const r = await api.get(`/customers${params}`);
      setCustomers(r.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 300);
    return () => clearTimeout(t);
  }, [loadCustomers]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/customers', form);
      toast.success('Customer created');
      setShowNewModal(false);
      setForm({ name: '', phone: '', email: '', address: '', city: '', state: 'NJ', zip: '' });
      loadCustomers();
    } catch { toast.error('Failed to create customer'); }
  }

  async function handleDelete(c, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Permanently delete "${c.name}"? This will also remove their jobs and memberships.`)) return;
    try {
      await api.delete(`/customers/${c.id}`);
      toast.success('Customer deleted');
      loadCustomers();
    } catch { toast.error('Failed to delete customer'); }
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Customers</h1>
          <p className="text-sm text-text-muted">{customers.length} customers</p>
        </div>
        {canManageData && (
          <button onClick={() => setShowNewModal(true)} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ New Customer</button>
        )}
      </div>

      <div className="mb-4">
        <input
          className="forge-input max-w-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone..."
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-bg-card rounded-xl border border-border animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-text-muted text-sm">No customers found</div>
          ) : customers.map(c => (
            <div key={c.id} className="relative group">
              <Link to={`/customers/${c.id}`} className="block bg-bg-card border border-border rounded-xl p-4 hover:border-border-focus transition-all">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-text-primary">{c.name}</p>
                    {c.phone && <p className="text-sm text-text-secondary mt-0.5">{c.phone}</p>}
                    {c.email && <p className="text-xs text-text-muted truncate mt-0.5">{c.email}</p>}
                    {c.city && <p className="text-xs text-text-muted mt-0.5">{c.city}, {c.state}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c._count?.jobs > 0 && <p className="text-xs text-text-muted">{c._count.jobs} job{c._count.jobs !== 1 ? 's' : ''}</p>}
                    {c._count?.memberships > 0 && <p className="text-xs text-green-400">Member</p>}
                  </div>
                </div>
              </Link>
              {canManageData && (
                <button
                  onClick={(e) => handleDelete(c, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2 py-1 rounded-lg transition-all"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewModal && (
        <Modal title="New Customer" onClose={() => setShowNewModal(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Name *</label>
              <input className="forge-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Phone</label>
                <input className="forge-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="555-555-5555" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Email</label>
                <input className="forge-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Address</label>
              <input className="forge-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-xs text-text-muted mb-1 block">City</label>
                <input className="forge-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Newark" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">State</label>
                <select className="forge-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                  <option>NJ</option><option>NY</option><option>PA</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">ZIP</label>
                <input className="forge-input" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="07101" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Create</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

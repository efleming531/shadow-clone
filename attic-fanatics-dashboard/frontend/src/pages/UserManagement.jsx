import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/UI/Modal';
import SortableTable from '../components/UI/SortableTable';
import { fmtDate } from '../utils/formatters';

const roleBadge = (role) => {
  const styles = {
    OWNER: 'bg-accent/20 text-accent border border-accent/30',
    MANAGER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    REP: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${styles[role]}`}>{role}</span>;
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'REP' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('User created');
      setAddModal(false);
      setForm({ name: '', email: '', password: '', role: 'REP' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await api.patch(`/users/${editModal.id}`, { name: form.name, role: form.role, isActive: form.isActive });
      toast.success('User updated');
      setEditModal(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, role: user.role, isActive: user.isActive });
    setEditModal(user);
  };

  const inputClass = "w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5";

  const columns = [
    { key: 'name', label: 'Name', render: v => <span className="font-semibold text-white">{v}</span> },
    { key: 'email', label: 'Email', render: v => <span className="text-text-secondary">{v}</span> },
    { key: 'role', label: 'Role', render: (v) => roleBadge(v) },
    { key: 'lastLogin', label: 'Last Login', render: v => v ? <span className="text-text-secondary">{fmtDate(v)}</span> : <span className="text-text-muted">Never</span> },
    { key: 'isActive', label: 'Status', render: (v, row) => (
      <button onClick={e => { e.stopPropagation(); handleToggleActive(row); }} className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all ${v ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30'}`}>
        {v ? 'Active' : 'Inactive'}
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">User Management</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage team accounts and permissions</p>
        </div>
        <button
          onClick={() => { setForm({ name: '', email: '', password: '', role: 'REP' }); setAddModal(true); }}
          className="bg-accent hover:bg-accent-hover text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + Add User
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-14 animate-pulse bg-bg-card border border-border rounded-xl" />)}</div>
      ) : (
        <SortableTable
          columns={columns}
          data={users}
          onRowClick={openEdit}
          emptyMessage="No users found."
        />
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New User">
        <div className="space-y-4">
          {[['name', 'Full Name', 'text', 'John Doe'], ['email', 'Email', 'email', 'john@atticfanatics.com'], ['password', 'Temporary Password', 'password', '••••••••']].map(([k, l, t, ph]) => (
            <div key={k}>
              <label className={labelClass}>{l}</label>
              <input type={t} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph} className={inputClass} />
            </div>
          ))}
          <div>
            <label className={labelClass}>Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={inputClass}>
              <option value="REP">Rep</option>
              <option value="MANAGER">Manager</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <button onClick={handleAdd} disabled={saving} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors text-sm mt-2">
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit: ${editModal?.name}`}>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={inputClass}>
              <option value="REP">Rep</option>
              <option value="MANAGER">Manager</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <button onClick={handleEdit} disabled={saving} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

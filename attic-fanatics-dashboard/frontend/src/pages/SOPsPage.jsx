import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const CATEGORY_COLORS = {
  Sales: 'bg-blue-500/15 text-blue-400',
  Operations: 'bg-green-500/15 text-green-400',
  'Call Center': 'bg-purple-500/15 text-purple-400',
  Finance: 'bg-yellow-500/15 text-yellow-400',
  HR: 'bg-orange-500/15 text-orange-400',
};

export default function SOPsPage() {
  const [sops, setSops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedSop, setSelectedSop] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const { canManageData } = useAuth();

  useEffect(() => { loadSops(); }, [categoryFilter]);

  async function loadSops() {
    setLoading(true);
    try {
      const params = categoryFilter ? `?category=${encodeURIComponent(categoryFilter)}` : '';
      const [sopsR, catsR] = await Promise.all([
        api.get(`/sops${params}`),
        api.get('/sops/categories'),
      ]);
      setSops(sopsR.data);
      setCategories(catsR.data);
    } catch { toast.error('Failed to load SOPs'); }
    finally { setLoading(false); }
  }

  async function loadSopDetail(id) {
    try {
      const r = await api.get(`/sops/${id}`);
      setSelectedSop(r.data);
    } catch { toast.error('Failed to load SOP'); }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/sops/${editingId}`, form);
        toast.success('SOP updated');
      } else {
        await api.post('/sops', form);
        toast.success('SOP created');
      }
      setShowEditModal(false);
      setEditingId(null);
      setForm({ title: '', category: '', content: '' });
      loadSops();
      if (selectedSop && editingId === selectedSop.id) {
        loadSopDetail(editingId);
      }
    } catch { toast.error('Failed to save SOP'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Archive this SOP?')) return;
    try {
      await api.delete(`/sops/${id}`);
      toast.success('SOP archived');
      if (selectedSop?.id === id) setSelectedSop(null);
      loadSops();
    } catch { toast.error('Failed to archive SOP'); }
  }

  function openEdit(sop) {
    setEditingId(sop.id);
    setForm({ title: sop.title, category: sop.category, content: sop.content });
    setShowEditModal(true);
  }

  const allCategories = ['', ...categories.map(c => c.category)];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">SOPs</h1>
          <p className="text-sm text-text-muted">Standard Operating Procedures library</p>
        </div>
        {canManageData && (
          <button onClick={() => { setEditingId(null); setForm({ title: '', category: '', content: '' }); setShowEditModal(true); }} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New SOP
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {allCategories.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${categoryFilter === c ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'}`}>
            {c || 'All'}
            {c && categories.find(cat => cat.category === c) && (
              <span className="ml-1 text-text-muted">({categories.find(cat => cat.category === c)?.count})</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-bg-card rounded-xl border border-border animate-pulse" />)
          ) : sops.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">No SOPs found</p>
          ) : sops.map(sop => (
            <button
              key={sop.id}
              onClick={() => loadSopDetail(sop.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selectedSop?.id === sop.id ? 'border-accent bg-accent/5' : 'border-border bg-bg-card hover:border-border-focus'}`}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-text-primary truncate pr-2">{sop.title}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${CATEGORY_COLORS[sop.category] || 'bg-gray-500/15 text-gray-400'}`}>{sop.category}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-text-muted">v{sop.version}</span>
                <span className="text-xs text-text-muted">· {sop.createdBy?.name}</span>
                <span className="text-xs text-text-muted">· {new Date(sop.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedSop ? (
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{selectedSop.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${CATEGORY_COLORS[selectedSop.category] || 'bg-gray-500/15 text-gray-400'}`}>{selectedSop.category}</span>
                    <span className="text-xs text-text-muted">v{selectedSop.version}</span>
                    <span className="text-xs text-text-muted">Updated {new Date(selectedSop.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {canManageData && (
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(selectedSop)} className="text-xs px-2 py-1 bg-bg-elevated border border-border rounded text-text-secondary hover:text-text-primary transition-colors">Edit</button>
                    <button onClick={() => handleDelete(selectedSop.id)} className="text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:bg-red-500/20 transition-colors">Archive</button>
                  </div>
                )}
              </div>
              <div className="forge-prose overflow-y-auto max-h-[calc(100vh-400px)] pr-2">
                {selectedSop.content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                  if (line.startsWith('- [ ] ')) return <p key={i} className="flex items-start gap-2"><span>☐</span><span>{line.slice(6)}</span></p>;
                  if (line.startsWith('- ')) return <p key={i} className="flex items-start gap-2"><span>•</span><span>{line.slice(2)}</span></p>;
                  if (/^\d+\.\s/.test(line)) return <p key={i}>{line}</p>;
                  if (line === '') return <div key={i} className="h-2" />;
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          ) : (
            <div className="bg-bg-card border border-border rounded-xl p-6 flex items-center justify-center h-64">
              <p className="text-text-muted text-sm">Select an SOP from the list to view its contents</p>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <Modal title={editingId ? 'Edit SOP' : 'New SOP'} onClose={() => { setShowEditModal(false); setEditingId(null); }}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Title *</label>
              <input className="forge-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. New Lead Response Protocol" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Category *</label>
              <input className="forge-input" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Sales, Operations, Call Center..." list="category-list" />
              <datalist id="category-list">
                {categories.map(c => <option key={c.category} value={c.category} />)}
                <option value="Sales" /><option value="Operations" /><option value="Call Center" /><option value="Finance" />
              </datalist>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Content (Markdown supported)</label>
              <textarea className="forge-input resize-none font-mono text-xs" rows={12} required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="# Title&#10;## Section&#10;- Step 1&#10;- Step 2" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setShowEditModal(false); setEditingId(null); }} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

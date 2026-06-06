import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import { getText, getKanban, COLOR_OPTIONS, STAGE_COLOR_MAP } from '../utils/stageColors';

const fmtCurrency = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n || 0}`;

function LeadCard({ lead, isDragging }) {
  return (
    <Link
      to={`/leads/${lead.id}`}
      className={`block bg-bg-card border border-border rounded-lg p-3 hover:border-border-focus transition-all cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
    >
      <p className="text-sm font-semibold text-text-primary truncate">{lead.name}</p>
      <p className="text-xs text-text-muted mt-0.5">{lead.leadSource?.name}</p>
      {lead.city && <p className="text-xs text-text-muted">{lead.city}, {lead.state}</p>}
      <div className="flex items-center justify-between mt-2">
        {lead.estimatedValue ? (
          <span className="text-xs font-medium text-accent">{fmtCurrency(lead.estimatedValue)}</span>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        )}
        {lead.assignedRep && (
          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-text-secondary">{lead.assignedRep.name.split(' ')[0]}</span>
        )}
      </div>
    </Link>
  );
}

function SortableLeadCard({ lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({ stage, leads, isOver }) {
  const total = leads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
  return (
    <div className={`flex-shrink-0 w-64 flex flex-col rounded-xl border transition-colors ${isOver ? 'border-accent bg-accent/5' : 'border-border bg-bg-card'}`}>
      <div className={`p-3 border-b border-border rounded-t-xl ${stage.bg}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>{stage.label}</span>
          <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">{leads.length}</span>
        </div>
        {total > 0 && <p className="text-xs text-text-secondary mt-1">{fmtCurrency(total)}</p>}
      </div>
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] min-h-[80px]">
          {leads.map(lead => (
            <SortableLeadCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className="text-center py-6 text-text-muted text-xs">No leads</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function StagesDrawer({ onClose, onStagesChanged }) {
  const [stageList, setStageList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newForm, setNewForm] = useState({ label: '', color: 'blue' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/pipeline-stages').then(r => setStageList(r.data)).catch(() => {});
  }, []);

  async function handleSaveEdit(s) {
    setSaving(true);
    try {
      await api.patch(`/pipeline-stages/${s.id}`, editForm);
      setStageList(prev => prev.map(p => p.id === s.id ? { ...p, ...editForm } : p));
      setEditingId(null);
      onStagesChanged();
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  }

  async function handleMove(s, dir) {
    const idx = stageList.findIndex(x => x.id === s.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= stageList.length) return;
    const updated = [...stageList];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    const reordered = updated.map((x, i) => ({ ...x, order: i }));
    setStageList(reordered);
    try {
      await Promise.all(reordered.map(x => api.patch(`/pipeline-stages/${x.id}`, { order: x.order })));
      onStagesChanged();
    } catch { toast.error('Failed to reorder'); }
  }

  async function handleDelete(s) {
    try {
      await api.delete(`/pipeline-stages/${s.id}`);
      setStageList(prev => prev.filter(p => p.id !== s.id));
      onStagesChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete — leads exist in this stage');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newForm.label.trim()) return;
    try {
      const r = await api.post('/pipeline-stages', newForm);
      setStageList(prev => [...prev, r.data]);
      setNewForm({ label: '', color: 'blue' });
      onStagesChanged();
    } catch { toast.error('Failed to create stage'); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-96 h-full bg-bg-card border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-text-primary">Pipeline Stages</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {stageList.map((s, idx) => (
            <div key={s.id} className="bg-bg-elevated border border-border rounded-lg">
              {editingId === s.id ? (
                <div className="p-3 space-y-2">
                  <input
                    className="forge-input text-sm w-full"
                    value={editForm.label}
                    onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="Stage name"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => setEditForm(f => ({ ...f, color: c }))}
                        className={`w-6 h-6 rounded-full border-2 ${STAGE_COLOR_MAP[c].swatch} ${editForm.color === c ? 'border-white' : 'border-transparent'}`}
                        title={c}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                      <input type="checkbox" checked={editForm.isWon || false}
                        onChange={e => setEditForm(f => ({ ...f, isWon: e.target.checked, isLost: e.target.checked ? false : f.isLost }))}
                        className="accent-green-500" /> Won
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                      <input type="checkbox" checked={editForm.isLost || false}
                        onChange={e => setEditForm(f => ({ ...f, isLost: e.target.checked, isWon: e.target.checked ? false : f.isWon }))}
                        className="accent-red-500" /> Lost
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-card rounded">Cancel</button>
                    <button disabled={saving} onClick={() => handleSaveEdit(s)} className="px-3 py-1 text-xs font-semibold bg-accent hover:bg-accent-hover text-white rounded">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${STAGE_COLOR_MAP[s.color]?.swatch ?? 'bg-gray-500'}`} />
                  <span className="flex-1 text-sm text-text-primary font-medium truncate">{s.label}</span>
                  {s.isWon && <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded">WON</span>}
                  {s.isLost && <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">LOST</span>}
                  <div className="flex items-center gap-1 ml-1">
                    <button onClick={() => handleMove(s, -1)} disabled={idx === 0} className="text-text-muted hover:text-text-primary disabled:opacity-30 text-xs w-5 h-5 flex items-center justify-center">↑</button>
                    <button onClick={() => handleMove(s, 1)} disabled={idx === stageList.length - 1} className="text-text-muted hover:text-text-primary disabled:opacity-30 text-xs w-5 h-5 flex items-center justify-center">↓</button>
                    <button onClick={() => { setEditingId(s.id); setEditForm({ label: s.label, color: s.color, isWon: s.isWon, isLost: s.isLost }); }} className="text-text-muted hover:text-accent text-xs w-5 h-5 flex items-center justify-center">✎</button>
                    <button onClick={() => handleDelete(s)} className="text-text-muted hover:text-red-400 text-xs w-5 h-5 flex items-center justify-center">✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border flex-shrink-0">
          <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Add Stage</p>
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              className="forge-input text-sm w-full"
              placeholder="Stage name"
              value={newForm.label}
              onChange={e => setNewForm(f => ({ ...f, label: e.target.value }))}
            />
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewForm(f => ({ ...f, color: c }))}
                  className={`w-5 h-5 rounded-full border-2 ${STAGE_COLOR_MAP[c].swatch} ${newForm.color === c ? 'border-white' : 'border-transparent'}`}
                  title={c}
                />
              ))}
            </div>
            <button type="submit" className="w-full py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">
              + Add Stage
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LeadsKanban() {
  const [kanban, setKanban] = useState({});
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeLead, setActiveLead] = useState(null);
  const [overId, setOverId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showStagesDrawer, setShowStagesDrawer] = useState(false);
  const [sources, setSources] = useState([]);
  const [reps, setReps] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', state: 'NJ', leadSourceId: '', estimatedValue: '' });
  const { canManageData } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    loadKanban();
    api.get('/pipeline-stages').then(r => setStages(r.data)).catch(() => {});
    api.get('/funnel/sources').then(r => setSources(r.data)).catch(() => {});
    api.get('/sales/leaderboard').then(r => setReps(r.data?.reps || r.data || [])).catch(() => {});
  }, []);

  async function loadKanban() {
    setLoading(true);
    try {
      const r = await api.get('/leads/kanban');
      setKanban(r.data);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  async function reloadStages() {
    try {
      const r = await api.get('/pipeline-stages');
      setStages(r.data);
    } catch {}
  }

  function findLeadById(id) {
    for (const stage of Object.values(kanban)) {
      const lead = stage.find(l => l.id === id);
      if (lead) return lead;
    }
    return null;
  }

  function findStageForLead(id) {
    for (const [stage, leads] of Object.entries(kanban)) {
      if (leads.find(l => l.id === id)) return stage;
    }
    return null;
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
    setActiveLead(findLeadById(event.active.id));
  }

  function handleDragOver(event) {
    const { over } = event;
    if (over) setOverId(over.id);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);
    setOverId(null);

    if (!over) return;

    const fromStage = findStageForLead(active.id);
    const toStage = stages.find(s => s.slug === over.id)?.slug || findStageForLead(over.id);

    if (!fromStage || !toStage || fromStage === toStage) return;

    const lead = findLeadById(active.id);
    if (!lead) return;

    setKanban(prev => {
      const updated = { ...prev };
      updated[fromStage] = prev[fromStage].filter(l => l.id !== active.id);
      updated[toStage] = [{ ...lead, stage: toStage }, ...prev[toStage]];
      return updated;
    });

    try {
      await api.patch(`/leads/${active.id}`, { stage: toStage });
      toast.success(`Moved to ${stages.find(s => s.slug === toStage)?.label ?? toStage}`);
    } catch {
      toast.error('Failed to update stage');
      loadKanban();
    }
  }

  async function handleCreateLead(e) {
    e.preventDefault();
    try {
      await api.post('/leads', form);
      toast.success('Lead created');
      setShowNewModal(false);
      setForm({ name: '', phone: '', email: '', city: '', state: 'NJ', leadSourceId: '', estimatedValue: '' });
      loadKanban();
    } catch {
      toast.error('Failed to create lead');
    }
  }

  const terminalSlugs = stages.filter(s => s.isWon || s.isLost).map(s => s.slug);
  const totalPipelineValue = Object.entries(kanban)
    .filter(([s]) => !terminalSlugs.includes(s))
    .reduce((sum, [, leads]) => sum + leads.reduce((s, l) => s + (l.estimatedValue || 0), 0), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-bg-elevated rounded animate-pulse" />
          <div className="h-9 w-32 bg-bg-elevated rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex-shrink-0 w-64 h-96 bg-bg-card rounded-xl border border-border animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-primary">CRM Pipeline</h1>
          <p className="text-sm text-text-muted">Pipeline value: <span className="text-accent font-semibold">${totalPipelineValue.toLocaleString()}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/leads" className="text-sm text-text-secondary hover:text-text-primary transition-colors">List View</Link>
          {canManageData && (
            <button onClick={() => setShowStagesDrawer(true)} className="text-sm text-text-secondary hover:text-text-primary border border-border hover:border-border-focus px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5">
              ⚙ Stages
            </button>
          )}
          {canManageData && (
            <button onClick={() => setShowNewModal(true)} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + New Lead
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full pb-4">
            {stages.map(s => {
              const stage = { key: s.slug, label: s.label, color: getText(s.color), bg: getKanban(s.color) };
              return (
                <KanbanColumn
                  key={s.slug}
                  stage={stage}
                  leads={kanban[s.slug] || []}
                  isOver={overId === s.slug}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} />}
          </DragOverlay>
        </DndContext>
      </div>

      {showStagesDrawer && (
        <StagesDrawer onClose={() => setShowStagesDrawer(false)} onStagesChanged={() => { reloadStages(); loadKanban(); }} />
      )}

      {showNewModal && (
        <Modal title="New Lead" onClose={() => setShowNewModal(false)}>
          <form onSubmit={handleCreateLead} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-text-muted mb-1 block">Name *</label>
                <input className="forge-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Phone</label>
                <input className="forge-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="555-555-5555" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Email</label>
                <input className="forge-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div>
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
                <label className="text-xs text-text-muted mb-1 block">Lead Source *</label>
                <select className="forge-input" required value={form.leadSourceId} onChange={e => setForm(f => ({ ...f, leadSourceId: e.target.value }))}>
                  <option value="">Select source</option>
                  {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Est. Value ($)</label>
                <input className="forge-input" type="number" value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value }))} placeholder="5000" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Create Lead</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

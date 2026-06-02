import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const STAGES = [
  { key: 'NEW', label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { key: 'CONTACTED', label: 'Contacted', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { key: 'ESTIMATE_SENT', label: 'Estimate Sent', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { key: 'NEGOTIATING', label: 'Negotiating', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { key: 'WON', label: 'Won', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { key: 'LOST', label: 'Lost', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
];

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
      {lead.estimates?.length > 0 && (
        <div className="mt-1.5 flex gap-1">
          {lead.estimates.slice(0, 2).map((e, i) => (
            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full ${e.status === 'ACCEPTED' ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}`}>
              EST {fmtCurrency(e.total)}
            </span>
          ))}
        </div>
      )}
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

export default function LeadsKanban() {
  const [kanban, setKanban] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeLead, setActiveLead] = useState(null);
  const [overId, setOverId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [sources, setSources] = useState([]);
  const [reps, setReps] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', state: 'NJ', leadSourceId: '', estimatedValue: '' });
  const { canManageData } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    loadKanban();
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
    const toStage = STAGES.find(s => s.key === over.id)?.key || findStageForLead(over.id);

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
      toast.success(`Moved to ${STAGES.find(s => s.key === toStage)?.label}`);
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

  const totalPipelineValue = Object.entries(kanban)
    .filter(([s]) => !['WON', 'LOST', 'UNQUALIFIED'].includes(s))
    .reduce((sum, [, leads]) => sum + leads.reduce((s, l) => s + (l.estimatedValue || 0), 0), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-bg-elevated rounded animate-pulse" />
          <div className="h-9 w-32 bg-bg-elevated rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => <div key={s.key} className="flex-shrink-0 w-64 h-96 bg-bg-card rounded-xl border border-border animate-pulse" />)}
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
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                leads={kanban[stage.key] || []}
                isOver={overId === stage.key}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} />}
          </DragOverlay>
        </DndContext>
      </div>

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

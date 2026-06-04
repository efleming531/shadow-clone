import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { STAGE_COLOR_MAP, COLOR_OPTIONS } from '../utils/stageColors';

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {COLOR_OPTIONS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full ${STAGE_COLOR_MAP[c].swatch} transition-transform ${value === c ? 'ring-2 ring-white ring-offset-1 ring-offset-bg-card scale-110' : 'opacity-60 hover:opacity-100'}`}
          title={c}
        />
      ))}
    </div>
  );
}

function StageRow({ stage, onSave, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(stage.label);
  const [color, setColor] = useState(stage.color);
  const [isWon, setIsWon] = useState(stage.isWon);
  const [isLost, setIsLost] = useState(stage.isLost);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(stage.id, { label, color, isWon, isLost });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setLabel(stage.label);
    setColor(stage.color);
    setIsWon(stage.isWon);
    setIsLost(stage.isLost);
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete stage "${stage.label}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await onDelete(stage.id);
    } finally {
      setDeleting(false);
    }
  }

  const badgeClass = STAGE_COLOR_MAP[stage.color]?.badge ?? STAGE_COLOR_MAP.gray.badge;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      {editing ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1 block">Stage Name</label>
              <input
                className="forge-input"
                value={label}
                onChange={e => setLabel(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isWon}
                onChange={e => { setIsWon(e.target.checked); if (e.target.checked) setIsLost(false); }}
                className="accent-green-500"
              />
              <span className="text-xs text-text-secondary">Mark as Won</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLost}
                onChange={e => { setIsLost(e.target.checked); if (e.target.checked) setIsWon(false); }}
                className="accent-red-500"
              />
              <span className="text-xs text-text-secondary">Mark as Lost</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !label.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Order controls */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="text-text-muted hover:text-text-secondary disabled:opacity-20 text-xs leading-none"
            >▲</button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="text-text-muted hover:text-text-secondary disabled:opacity-20 text-xs leading-none"
            >▼</button>
          </div>

          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badgeClass}`}>
            {stage.label}
          </span>

          <div className="flex items-center gap-1.5 flex-1">
            {stage.isWon && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded font-semibold">WON</span>}
            {stage.isLost && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded font-semibold">LOST</span>}
          </div>

          <span className="text-xs text-text-muted font-mono">{stage.slug}</span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-bg-elevated transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleting ? '…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('blue');
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const r = await api.get('/pipeline-stages');
      setStages(r.data);
    } catch {
      toast.error('Failed to load stages');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(id, data) {
    try {
      await api.patch(`/pipeline-stages/${id}`, data);
      toast.success('Stage updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update stage');
      throw err;
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/pipeline-stages/${id}`);
      toast.success('Stage deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete stage');
    }
  }

  async function handleMoveUp(index) {
    if (index === 0) return;
    const reordered = [...stages];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    await saveOrder(reordered);
  }

  async function handleMoveDown(index) {
    if (index === stages.length - 1) return;
    const reordered = [...stages];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    await saveOrder(reordered);
  }

  async function saveOrder(reordered) {
    setStages(reordered);
    try {
      await Promise.all(reordered.map((s, i) => api.patch(`/pipeline-stages/${s.id}`, { order: i })));
    } catch {
      toast.error('Failed to save order');
      load();
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/pipeline-stages', { label: newLabel, color: newColor });
      toast.success('Stage created');
      setNewLabel('');
      setNewColor('blue');
      setShowNew(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create stage');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Pipeline Stages</h1>
          <p className="text-sm text-text-muted">Customize stages shown on the Kanban board and lead lists</p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Stage
        </button>
      </div>

      {showNew && (
        <div className="bg-bg-card border border-accent/20 rounded-xl p-4 mb-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-text-primary mb-3">New Stage</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Stage Name</label>
              <input
                className="forge-input"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Follow Up, Proposal Sent…"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Color</label>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating || !newLabel.trim()}
                className="px-3 py-1.5 text-xs font-semibold bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {creating ? 'Creating…' : 'Create Stage'}
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setNewLabel(''); }}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-bg-card rounded-xl border border-border animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {stages.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">No stages yet. Create one above.</div>
          ) : stages.map((stage, i) => (
            <StageRow
              key={stage.id}
              stage={stage}
              onSave={handleSave}
              onDelete={handleDelete}
              onMoveUp={() => handleMoveUp(i)}
              onMoveDown={() => handleMoveDown(i)}
              isFirst={i === 0}
              isLast={i === stages.length - 1}
            />
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-bg-elevated border border-border rounded-xl text-xs text-text-muted">
        <strong className="text-text-secondary">Tips:</strong> The slug (grey monospace text) is permanent and used internally.
        Rename the label freely. Mark a stage as <span className="text-green-400 font-semibold">WON</span> or <span className="text-red-400 font-semibold">LOST</span> to include it in close-rate analytics.
        You cannot delete a stage that has active leads — move them first.
      </div>
    </div>
  );
}

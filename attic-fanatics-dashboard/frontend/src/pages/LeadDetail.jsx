import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'ESTIMATE_SENT', 'NEGOTIATING', 'WON', 'LOST', 'UNQUALIFIED'];
const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'SMS', 'VISIT', 'NOTE', 'FOLLOW_UP'];

const STAGE_COLORS = {
  NEW: 'bg-blue-500/15 text-blue-400',
  CONTACTED: 'bg-purple-500/15 text-purple-400',
  QUALIFIED: 'bg-yellow-500/15 text-yellow-400',
  ESTIMATE_SENT: 'bg-orange-500/15 text-orange-400',
  NEGOTIATING: 'bg-red-500/15 text-red-400',
  WON: 'bg-green-500/15 text-green-400',
  LOST: 'bg-gray-500/15 text-gray-400',
  UNQUALIFIED: 'bg-gray-700/30 text-gray-500',
};

const ACTIVITY_ICONS = { CALL: '📞', EMAIL: '✉️', SMS: '💬', VISIT: '🏠', NOTE: '📝', FOLLOW_UP: '🔔' };

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageData, isOwner } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [activity, setActivity] = useState({ type: 'CALL', subject: '', body: '' });
  const [newStage, setNewStage] = useState('');
  const [quotes, setQuotes] = useState([]);

  useEffect(() => { loadLead(); loadQuotes(); }, [id]);

  async function loadQuotes() {
    try {
      const r = await api.get(`/roofing-quotes?leadId=${id}`);
      setQuotes(r.data);
    } catch {}
  }

  async function loadLead() {
    setLoading(true);
    try {
      const r = await api.get(`/leads/${id}`);
      setLead(r.data);
      setNewStage(r.data.stage);
    } catch {
      toast.error('Lead not found');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  }

  async function handleStageChange() {
    try {
      await api.patch(`/leads/${id}`, { stage: newStage });
      toast.success('Stage updated');
      setShowStageModal(false);
      loadLead();
    } catch {
      toast.error('Failed to update stage');
    }
  }

  async function handleAddActivity(e) {
    e.preventDefault();
    try {
      await api.post(`/leads/${id}/activities`, activity);
      toast.success('Activity logged');
      setShowActivityModal(false);
      setActivity({ type: 'CALL', subject: '', body: '' });
      loadLead();
    } catch {
      toast.error('Failed to log activity');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead deleted');
      navigate('/leads');
    } catch {
      toast.error('Failed to delete lead');
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-bg-elevated rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-bg-card rounded-xl border border-border animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link to="/leads" className="hover:text-text-primary transition-colors">Pipeline</Link>
        <span>›</span>
        <span className="text-text-primary">{lead.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{lead.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[lead.stage]}`}>{lead.stage.replace('_', ' ')}</span>
            <span className="text-sm text-text-muted">{lead.leadSource?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManageData && (
            <>
              <button onClick={() => setShowStageModal(true)} className="px-3 py-1.5 text-sm bg-bg-elevated hover:bg-bg-hover border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                Change Stage
              </button>
              <button onClick={() => setShowActivityModal(true)} className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-semibold">
                + Log Activity
              </button>
            </>
          )}
          {isOwner && (
            <button onClick={handleDelete} className="px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lead info */}
        <div className="space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Contact Info</h3>
            <div className="space-y-2">
              {lead.phone && <div className="flex items-center gap-2 text-sm"><span className="text-text-muted">Phone:</span><a href={`tel:${lead.phone}`} className="text-text-primary hover:text-accent">{lead.phone}</a></div>}
              {lead.email && <div className="flex items-center gap-2 text-sm"><span className="text-text-muted">Email:</span><a href={`mailto:${lead.email}`} className="text-text-primary hover:text-accent truncate">{lead.email}</a></div>}
              {lead.city && <div className="flex items-center gap-2 text-sm"><span className="text-text-muted">Location:</span><span className="text-text-primary">{lead.city}, {lead.state} {lead.zip}</span></div>}
              {lead.address && <div className="flex items-center gap-2 text-sm"><span className="text-text-muted">Address:</span><span className="text-text-primary">{lead.address}</span></div>}
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Deal Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-text-muted">Est. Value</span><span className="text-accent font-semibold">{lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-muted">Assigned To</span><span className="text-text-primary">{lead.assignedRep?.name || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-muted">Source</span><span className="text-text-primary">{lead.leadSource?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-muted">Created</span><span className="text-text-primary">{fmtDate(lead.createdAt)}</span></div>
            </div>
          </div>

          {lead.notes && (
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-text-secondary">{lead.notes}</p>
            </div>
          )}

          <div className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Roofing Quotes</h3>
              {canManageData && (
                <Link to={`/roofing-quotes/new?leadId=${lead.id}`} className="text-xs text-accent hover:text-accent-hover transition-colors">+ New Quote</Link>
              )}
            </div>
            {quotes.length > 0 ? (
              <div className="space-y-2">
                {quotes.map(q => (
                  <Link key={q.id} to={`/roofing-quotes/${q.id}`} className="flex items-center justify-between p-2 bg-bg-elevated rounded-lg hover:bg-bg-hover transition-colors">
                    <div>
                      <span className="text-sm font-mono text-accent">{q.number}</span>
                      {q.escalated && <span className="ml-2 text-[10px] text-red-400">⚠ escalated</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">${(q.total || 0).toLocaleString()}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        q.status === 'APPROVED' ? 'bg-green-500/15 text-green-400' :
                        q.status === 'ESCALATED' ? 'bg-red-500/15 text-red-400' :
                        q.status === 'ACCEPTED' ? 'bg-emerald-500/15 text-emerald-400' :
                        'bg-gray-500/15 text-gray-400'
                      }`}>{q.status.replace(/_/g, ' ')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-3">No quotes yet</p>
            )}
          </div>
        </div>

        {/* Right: Activity feed + Stage history */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Activity Feed</h3>
            {lead.activities?.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No activities yet. Log a call, email, or note.</p>
            ) : (
              <div className="space-y-3">
                {lead.activities.map(a => (
                  <div key={a.id} className="flex gap-3">
                    <div className="text-lg">{ACTIVITY_ICONS[a.type] || '•'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{a.subject}</span>
                        <span className="text-xs text-text-muted">{fmtDate(a.createdAt)}</span>
                      </div>
                      {a.body && <p className="text-xs text-text-secondary mt-0.5">{a.body}</p>}
                      <span className="text-xs text-text-muted">by {a.createdBy?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Stage History</h3>
            <div className="space-y-2">
              {lead.stageHistory?.map(h => (
                <div key={h.id} className="flex items-center gap-3 text-sm">
                  <span className="text-text-muted text-xs w-24 flex-shrink-0">{fmtDate(h.changedAt)}</span>
                  {h.fromStage && <><span className={`px-2 py-0.5 rounded text-xs ${STAGE_COLORS[h.fromStage]}`}>{h.fromStage.replace('_', ' ')}</span><span className="text-text-muted">→</span></>}
                  <span className={`px-2 py-0.5 rounded text-xs ${STAGE_COLORS[h.toStage]}`}>{h.toStage.replace('_', ' ')}</span>
                  <span className="text-text-muted text-xs">by {h.changedBy?.name}</span>
                  {h.note && <span className="text-text-secondary text-xs italic">"{h.note}"</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showActivityModal && (
        <Modal title="Log Activity" onClose={() => setShowActivityModal(false)}>
          <form onSubmit={handleAddActivity} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Type</label>
              <select className="forge-input" value={activity.type} onChange={e => setActivity(a => ({ ...a, type: e.target.value }))}>
                {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Subject *</label>
              <input className="forge-input" required value={activity.subject} onChange={e => setActivity(a => ({ ...a, subject: e.target.value }))} placeholder="Called to schedule inspection" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Notes</label>
              <textarea className="forge-input resize-none" rows={3} value={activity.body} onChange={e => setActivity(a => ({ ...a, body: e.target.value }))} placeholder="Details..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowActivityModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Log Activity</button>
            </div>
          </form>
        </Modal>
      )}

      {showStageModal && (
        <Modal title="Change Stage" onClose={() => setShowStageModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => setNewStage(s)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${newStage === s ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-elevated text-text-secondary hover:text-text-primary hover:border-border-focus'}`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowStageModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button onClick={handleStageChange} className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Update Stage</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

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

function exportLeadsToPDF(leads) {
  const rows = leads.map(l => `
    <tr>
      <td>${l.name}</td>
      <td>${l.phone || '—'}</td>
      <td>${l.email || '—'}</td>
      <td>${l.city ? `${l.city}, ${l.state}` : '—'}</td>
      <td>${l.stage.replace('_', ' ')}</td>
      <td>${l.leadSource?.name || '—'}</td>
      <td>${l.estimatedValue ? `$${l.estimatedValue.toLocaleString()}` : '—'}</td>
      <td>${l.assignedRep?.name || '—'}</td>
      <td>${new Date(l.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>FORGE — Leads Export</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #111; background: #fff; padding: 24px; }
    h1 { font-size: 20px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px; }
    .meta { font-size: 10px; color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #111; color: #fff; text-align: left; padding: 8px 10px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .stage-WON { background: #dcfce7; color: #15803d; }
    .stage-LOST { background: #f3f4f6; color: #6b7280; }
    .stage-NEGOTIATING { background: #fee2e2; color: #dc2626; }
    .stage-ESTIMATE_SENT { background: #ffedd5; color: #c2410c; }
    .stage-QUALIFIED { background: #fef9c3; color: #a16207; }
    .stage-CONTACTED { background: #f3e8ff; color: #7e22ce; }
    .stage-NEW { background: #dbeafe; color: #1d4ed8; }
    .stage-UNQUALIFIED { background: #f3f4f6; color: #9ca3af; }
    @media print {
      body { padding: 0; }
      @page { size: landscape; margin: 12mm; }
    }
  </style>
</head>
<body>
  <h1>FORGE</h1>
  <p class="meta">Leads Export · ${leads.length} record${leads.length !== 1 ? 's' : ''} · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <table>
    <thead>
      <tr>
        <th>Name</th><th>Phone</th><th>Email</th><th>Location</th>
        <th>Stage</th><th>Source</th><th>Est. Value</th><th>Rep</th><th>Created</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { toast.error('Allow pop-ups to export PDF'); return; }
  win.document.write(html);
  win.document.close();
}

export default function LeadsListPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const { canManageData } = useAuth();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stageFilter) params.append('stage', stageFilter);
      if (search) params.append('search', search);
      const r = await api.get(`/leads?${params}`);
      setLeads(r.data);
      setSelected(new Set());
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }, [stageFilter, search]);

  useEffect(() => {
    const t = setTimeout(loadLeads, 300);
    return () => clearTimeout(t);
  }, [loadLeads]);

  const allSelected = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map(l => l.id)));
    }
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    const count = selected.size;
    if (!window.confirm(`Permanently delete ${count} lead${count !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete('/leads/bulk', { data: { ids: Array.from(selected) } });
      toast.success(`${count} lead${count !== 1 ? 's' : ''} deleted`);
      loadLeads();
    } catch {
      toast.error('Failed to delete leads');
    } finally {
      setDeleting(false);
    }
  }

  function handleExportPDF() {
    const toExport = someSelected
      ? leads.filter(l => selected.has(l.id))
      : leads;

    if (toExport.length === 0) { toast.error('No leads to export'); return; }
    exportLeadsToPDF(toExport);
  }

  const selectedLeads = leads.filter(l => selected.has(l.id));

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">All Leads</h1>
          <p className="text-sm text-text-muted">{leads.length} leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-sm border border-border bg-bg-card text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            ↓ Export PDF{someSelected ? ` (${selected.size})` : ''}
          </button>
          <Link to="/leads/kanban" className="text-sm text-text-secondary hover:text-text-primary transition-colors border border-border px-3 py-1.5 rounded-lg">
            Kanban View
          </Link>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          className="forge-input max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search leads..."
        />
        <select className="forge-input w-44" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="">All Stages</option>
          {['NEW', 'CONTACTED', 'QUALIFIED', 'ESTIMATE_SENT', 'NEGOTIATING', 'WON', 'LOST', 'UNQUALIFIED'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-accent/5 border border-accent/20 rounded-xl animate-fade-in">
          <span className="text-sm font-semibold text-accent">{selected.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-xs font-medium bg-bg-elevated border border-border text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            ↓ Export to PDF
          </button>
          {canManageData && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : `Delete ${selected.size}`}
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-bg-card rounded-lg border border-border animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-[#f97316] cursor-pointer rounded"
                  />
                </th>
                {['Name', 'Stage', 'Source', 'Location', 'Est. Value', 'Rep', 'Created'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-text-muted py-12 text-sm">No leads found</td>
                </tr>
              ) : leads.map(l => (
                <tr
                  key={l.id}
                  className={`hover:bg-bg-elevated transition-colors ${selected.has(l.id) ? 'bg-accent/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => toggleOne(l.id)}
                      className="w-4 h-4 accent-[#f97316] cursor-pointer rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/leads/${l.id}`} className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">
                      {l.name}
                    </Link>
                    {l.phone && <p className="text-xs text-text-muted">{l.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[l.stage]}`}>
                      {l.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{l.leadSource?.name}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{l.city ? `${l.city}, ${l.state}` : '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-accent">
                    {l.estimatedValue ? `$${l.estimatedValue.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{l.assignedRep?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {leads.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
              <span className="text-xs text-text-muted">{leads.length} total leads</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAll}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
                {someSelected && (
                  <span className="text-xs text-accent font-medium">{selected.size} selected</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

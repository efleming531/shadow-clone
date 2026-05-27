import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/UI/Modal';
import { useAuth } from '../context/AuthContext';

const PROVIDERS = [
  { id: 'google-ads', name: 'Google Ads', icon: '🔍' },
  { id: 'meta-ads', name: 'Meta Ads', icon: '📘' },
  { id: 'tiktok-ads', name: 'TikTok Ads', icon: '🎵' },
  { id: 'workiz-crm', name: 'Workiz CRM', icon: '🔧' },
];

const DATA_FIELDS = [
  'date', 'adSpend', 'impressions', 'clicks', 'leadsGenerated',
  'formCompletions', 'callsBooked', 'callsShowed', 'callsClosed',
  'revenue', 'cashCollected', 'leadQuality', 'notes'
];

function ManualEntryForm({ sources }) {
  const [form, setForm] = useState({
    leadSourceSlug: '',
    date: new Date().toISOString().slice(0, 10),
    adSpend: '', impressions: '', clicks: '', leadsGenerated: '',
    formCompletions: '', callsBooked: '', callsShowed: '', callsClosed: '',
    revenue: '', cashCollected: '', leadQuality: 'WARM', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leadSourceSlug) return toast.error('Select a lead source');
    setSaving(true);
    try {
      await api.post('/funnel/entry', form);
      toast.success('Entry saved successfully');
      setForm(f => ({ ...f, adSpend: '', impressions: '', clicks: '', leadsGenerated: '', formCompletions: '', callsBooked: '', callsShowed: '', callsClosed: '', revenue: '', cashCollected: '', notes: '' }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Lead Source *</label>
          <select value={form.leadSourceSlug} onChange={e => set('leadSourceSlug', e.target.value)} className={inputClass}>
            <option value="">Select source...</option>
            {sources.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date *</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 pb-2 border-b border-border">Ad Performance</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['adSpend', 'Ad Spend ($)'], ['impressions', 'Impressions'], ['clicks', 'Clicks'], ['leadsGenerated', 'Leads Generated']].map(([k, l]) => (
            <div key={k}>
              <label className={labelClass}>{l}</label>
              <input type="number" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0" className={inputClass} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 pb-2 border-b border-border">Funnel Activity</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['formCompletions', 'Form Completions'], ['callsBooked', 'Calls Booked'], ['callsShowed', 'Calls Showed'], ['callsClosed', 'Calls Closed']].map(([k, l]) => (
            <div key={k}>
              <label className={labelClass}>{l}</label>
              <input type="number" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0" className={inputClass} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 pb-2 border-b border-border">Revenue</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Revenue ($)</label>
            <input type="number" value={form.revenue} onChange={e => set('revenue', e.target.value)} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cash Collected ($)</label>
            <input type="number" value={form.cashCollected} onChange={e => set('cashCollected', e.target.value)} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lead Quality</label>
            <select value={form.leadQuality} onChange={e => set('leadQuality', e.target.value)} className={inputClass}>
              <option value="HOT">🔥 Hot</option>
              <option value="WARM">🌤 Warm</option>
              <option value="COLD">❄️ Cold</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Optional notes..." className={`${inputClass} resize-none`} />
      </div>

      <button type="submit" disabled={saving} className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm">
        {saving ? 'Saving...' : 'Save Entry'}
      </button>
    </form>
  );
}

function CsvImport({ sources }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [sourceSlug, setSourceSlug] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (f) => {
    setFile(f);
    setPreview(null);
    setMapping({});
    const form = new FormData();
    form.append('file', f);
    setUploading(true);
    try {
      const res = await api.post('/funnel/import-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreview(res.data);
      const initMap = {};
      DATA_FIELDS.forEach(field => {
        const match = res.data.columns.find(c => c.toLowerCase().replace(/\s/g, '') === field.toLowerCase());
        if (match) initMap[field] = match;
      });
      setMapping(initMap);
    } catch {
      toast.error('Failed to parse CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!sourceSlug) return toast.error('Select a lead source');
    setConfirming(true);
    try {
      const allData = await (async () => {
        const form = new FormData();
        form.append('file', file);
        const r = await api.post('/funnel/import-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return r.data;
      })();
      const res = await api.post('/funnel/import-csv/confirm', {
        rows: allData.preview,
        columnMapping: mapping,
        leadSourceSlug: sourceSlug,
      });
      toast.success(`Imported ${res.data.imported} rows`);
      setFile(null); setPreview(null); setMapping({});
    } catch {
      toast.error('Import failed');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-accent bg-accent-muted' : 'border-border hover:border-accent/50'}`}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
        <p className="text-3xl mb-2">📁</p>
        <p className="text-white font-semibold">{file ? file.name : 'Drop CSV here or click to browse'}</p>
        <p className="text-text-secondary text-sm mt-1">Supports .csv files</p>
      </div>

      {uploading && <div className="text-center text-text-secondary text-sm animate-pulse">Parsing CSV...</div>}

      {preview && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Lead Source</label>
              <select value={sourceSlug} onChange={e => setSourceSlug(e.target.value)} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent">
                <option value="">Select source...</option>
                {sources.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            <p className="text-text-secondary text-sm">{preview.totalRows} rows detected</p>
          </div>

          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Column Mapping</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {DATA_FIELDS.map(field => (
                <div key={field}>
                  <label className="block text-xs text-text-muted mb-1">{field}</label>
                  <select
                    value={mapping[field] || ''}
                    onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                    className="w-full bg-bg-primary border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">— skip —</option>
                    {preview.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Preview (first 10 rows)</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border bg-bg-elevated">{preview.columns.map(c => <th key={c} className="px-3 py-2 text-left text-text-secondary">{c}</th>)}</tr></thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {preview.columns.map(c => <td key={c} className="px-3 py-2 text-text-primary whitespace-nowrap">{row[c]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={handleConfirm} disabled={confirming} className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm">
            {confirming ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      )}
    </div>
  );
}

function ApiConnections() {
  const [apiKeys, setApiKeys] = useState({});
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [key, setKey] = useState('');

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/api-connections/${modal}/key`, { apiKey: key });
      setApiKeys(k => ({ ...k, [modal]: key }));
      toast.success('API key saved');
      setModal(null);
      setKey('');
    } catch {
      toast.error('Failed to save key');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map(p => (
          <div key={p.id} className="bg-bg-elevated border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="font-semibold text-white text-sm">{p.name}</p>
                <p className="text-xs text-text-muted">{apiKeys[p.id] ? 'Key saved' : 'Not connected'}</p>
              </div>
            </div>
            <button
              onClick={() => { setModal(p.id); setKey(''); }}
              className="px-3 py-1.5 text-xs font-semibold bg-accent/10 border border-accent/30 text-accent hover:bg-accent-muted rounded-lg transition-all"
            >
              Connect
            </button>
          </div>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={`Connect ${PROVIDERS.find(p => p.id === modal)?.name || ''}`}>
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-400 text-xs font-semibold">⚡ Coming Soon</p>
            <p className="text-text-secondary text-xs mt-1">This integration is not yet active. Save your API key now and we'll connect it when the integration launches.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">API Key</label>
            <input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste your API key here..." className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
          </div>
          <button onClick={save} disabled={saving || !key} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
            {saving ? 'Saving...' : 'Save Key for Later'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function DataEntry() {
  const [tab, setTab] = useState('manual');
  const [sources, setSources] = useState([]);
  const { isOwner } = useAuth();

  useEffect(() => {
    api.get('/funnel/sources').then(res => setSources(res.data)).catch(() => {});
  }, []);

  const tabs = [
    { id: 'manual', label: 'Manual Entry' },
    { id: 'csv', label: 'CSV Import' },
    ...(isOwner ? [{ id: 'api', label: 'API Connections' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Data Entry</h1>
        <p className="text-text-secondary text-sm mt-0.5">Add funnel data manually, import CSV, or manage API connections</p>
      </div>

      <div className="flex items-center gap-1 bg-bg-card border border-border rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${tab === t.id ? 'bg-accent text-white' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-6">
        {tab === 'manual' && <ManualEntryForm sources={sources} />}
        {tab === 'csv' && <CsvImport sources={sources} />}
        {tab === 'api' && <ApiConnections />}
      </div>
    </div>
  );
}

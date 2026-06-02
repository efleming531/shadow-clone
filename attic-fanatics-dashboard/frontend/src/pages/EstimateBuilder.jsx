import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const fmtCurrency = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_COLORS = {
  DRAFT: 'bg-gray-500/15 text-gray-400',
  SENT: 'bg-blue-500/15 text-blue-400',
  ACCEPTED: 'bg-green-500/15 text-green-400',
  DECLINED: 'bg-red-500/15 text-red-400',
  EXPIRED: 'bg-yellow-500/15 text-yellow-400',
};

export default function EstimateBuilder() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [leadId] = useState(searchParams.get('leadId') || '');
  const [leads, setLeads] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(leadId);

  const [lineItems, setLineItems] = useState([{ description: '', qty: 1, unit: 'unit', unitPrice: 0, total: 0 }]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    api.get('/leads').then(r => setLeads(r.data)).catch(() => {});
    api.get('/materials').then(r => setMaterials(r.data.materials || [])).catch(() => {});
    if (!isNew) loadEstimate();
  }, [id]);

  async function loadEstimate() {
    setLoading(true);
    try {
      const r = await api.get(`/estimates/${id}`);
      const e = r.data;
      setEstimate(e);
      setSelectedLeadId(e.leadId);
      setLineItems(Array.isArray(e.lineItems) ? e.lineItems : [{ description: '', qty: 1, unit: 'unit', unitPrice: 0, total: 0 }]);
      setTax(e.tax || 0);
      setDiscount(e.discount || 0);
      setNotes(e.notes || '');
      setValidUntil(e.validUntil ? e.validUntil.split('T')[0] : '');
    } catch {
      toast.error('Estimate not found');
      navigate('/estimates');
    } finally {
      setLoading(false);
    }
  }

  function updateLineItem(index, field, value) {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const qty = parseFloat(field === 'qty' ? value : updated[index].qty) || 0;
      const price = parseFloat(field === 'unitPrice' ? value : updated[index].unitPrice) || 0;
      updated[index].total = qty * price;
      return updated;
    });
  }

  function addLineItem(material) {
    const item = material
      ? {
          description: material.name,
          qty: 1,
          unit: material.unit,
          unitPrice: parseFloat((material.costPerUnit * (1 + material.markupPct / 100)).toFixed(2)),
          total: parseFloat((material.costPerUnit * (1 + material.markupPct / 100)).toFixed(2)),
        }
      : { description: '', qty: 1, unit: 'unit', unitPrice: 0, total: 0 };
    setLineItems(prev => [...prev, item]);
  }

  function removeLineItem(index) {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  }

  const subtotal = lineItems.reduce((s, item) => s + (parseFloat(item.total) || 0), 0);
  const total = subtotal + parseFloat(tax || 0) - parseFloat(discount || 0);

  async function handleSave(e) {
    e.preventDefault();
    if (!selectedLeadId) { toast.error('Please select a lead'); return; }

    setSaving(true);
    try {
      const payload = { leadId: selectedLeadId, lineItems, tax: parseFloat(tax) || 0, discount: parseFloat(discount) || 0, notes, validUntil: validUntil || null };

      if (isNew) {
        const r = await api.post('/estimates', payload);
        toast.success('Estimate created');
        navigate(`/estimates/${r.data.id}`);
      } else {
        await api.patch(`/estimates/${id}`, payload);
        toast.success('Estimate saved');
        loadEstimate();
      }
    } catch {
      toast.error('Failed to save estimate');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status) {
    try {
      await api.patch(`/estimates/${id}`, { status });
      toast.success(`Status updated to ${status}`);
      loadEstimate();
    } catch {
      toast.error('Failed to update status');
    }
  }

  if (loading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link to="/estimates" className="hover:text-text-primary transition-colors">Estimates</Link>
        <span>›</span>
        <span className="text-text-primary">{isNew ? 'New Estimate' : estimate?.number}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{isNew ? 'New Estimate' : estimate?.number}</h1>
          {estimate && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[estimate.status]}`}>{estimate.status}</span>
          )}
        </div>
        {!isNew && estimate && (
          <div className="flex gap-2">
            {estimate.status === 'DRAFT' && <button onClick={() => updateStatus('SENT')} className="px-3 py-1.5 text-sm bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">Mark Sent</button>}
            {estimate.status === 'SENT' && <button onClick={() => updateStatus('ACCEPTED')} className="px-3 py-1.5 text-sm bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors">Mark Accepted</button>}
            {['SENT', 'DRAFT'].includes(estimate.status) && <button onClick={() => updateStatus('DECLINED')} className="px-3 py-1.5 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">Mark Declined</button>}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Lead</h3>
          <select className="forge-input" value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} required>
            <option value="">Select lead...</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.city}</option>)}
          </select>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Line Items</h3>
            <div className="flex gap-2">
              <select className="forge-input w-auto text-xs" onChange={e => { if (e.target.value) { const m = materials.find(m => m.id === e.target.value); addLineItem(m); e.target.value = ''; } }}>
                <option value="">+ Add from materials</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
              <button type="button" onClick={() => addLineItem(null)} className="text-xs px-2 py-1 bg-bg-elevated border border-border rounded text-text-secondary hover:text-text-primary transition-colors">+ Custom</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs text-text-muted font-medium">Description</th>
                  <th className="pb-2 text-xs text-text-muted font-medium w-16">Qty</th>
                  <th className="pb-2 text-xs text-text-muted font-medium w-20">Unit</th>
                  <th className="pb-2 text-xs text-text-muted font-medium w-24 text-right">Unit Price</th>
                  <th className="pb-2 text-xs text-text-muted font-medium w-24 text-right">Total</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2"><input className="forge-input text-xs" value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder="Description" /></td>
                    <td className="py-2 pr-2"><input className="forge-input text-xs w-16 text-center" type="number" min="0" step="0.01" value={item.qty} onChange={e => updateLineItem(i, 'qty', e.target.value)} /></td>
                    <td className="py-2 pr-2"><input className="forge-input text-xs w-20" value={item.unit} onChange={e => updateLineItem(i, 'unit', e.target.value)} /></td>
                    <td className="py-2 pr-2"><input className="forge-input text-xs w-24 text-right" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateLineItem(i, 'unitPrice', e.target.value)} /></td>
                    <td className="py-2 pr-2 text-right"><span className="text-text-primary text-xs font-medium">{fmtCurrency(item.total)}</span></td>
                    <td className="py-2"><button type="button" onClick={() => removeLineItem(i)} className="text-text-muted hover:text-red-400 transition-colors text-xs">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm"><span className="text-text-muted">Subtotal</span><span className="text-text-primary font-medium">{fmtCurrency(subtotal)}</span></div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Tax</span>
              <input className="forge-input w-28 text-right text-xs" type="number" min="0" step="0.01" value={tax} onChange={e => setTax(e.target.value)} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Discount</span>
              <input className="forge-input w-28 text-right text-xs" type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span className="text-text-primary">Total</span>
              <span className="text-accent">{fmtCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <label className="text-xs text-text-muted block mb-1">Notes</label>
            <textarea className="forge-input resize-none" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Terms, conditions, or additional notes..." />
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <label className="text-xs text-text-muted block mb-1">Valid Until</label>
            <input className="forge-input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/estimates" className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated border border-border rounded-lg transition-colors">Cancel</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Estimate'}
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PITCH_MULTIPLIERS = {
  'flat': 1.000, '1/12': 1.003, '2/12': 1.014, '3/12': 1.031,
  '4/12': 1.054, '5/12': 1.083, '6/12': 1.118, '7/12': 1.158,
  '8/12': 1.202, '9/12': 1.250, '10/12': 1.302, '12/12': 1.414,
};
const PITCH_OPTIONS = Object.keys(PITCH_MULTIPLIERS);

const MATERIAL_PRESETS = [
  { key: 'architectural', label: '3-Tab Architectural', materialCost: 95, laborCost: 85 },
  { key: 'designer', label: 'Designer / Dimensional', materialCost: 145, laborCost: 95 },
  { key: 'premium', label: 'Premium Lifetime', materialCost: 210, laborCost: 110 },
  { key: 'metal-standing', label: 'Metal — Standing Seam', materialCost: 385, laborCost: 185 },
  { key: 'metal-ribbed', label: 'Metal — Ribbed Panel', materialCost: 265, laborCost: 155 },
  { key: 'cedar-shake', label: 'Cedar Shake', materialCost: 320, laborCost: 175 },
  { key: 'slate', label: 'Slate / Synthetic Slate', materialCost: 480, laborCost: 240 },
  { key: 'custom', label: 'Custom / Other', materialCost: 0, laborCost: 0 },
];

const ADD_ON_PRESETS = [
  { key: 'ice-shield', label: 'Ice & Water Shield', unitPrice: 18, unit: 'squares', perSquare: true, enabled: false },
  { key: 'underlayment', label: 'Synthetic Underlayment', unitPrice: 12, unit: 'squares', perSquare: true, enabled: false },
  { key: 'ridge-cap', label: 'Premium Ridge Cap', unitPrice: 4, unit: 'LF', perSquare: false, quantity: 0, enabled: false },
  { key: 'drip-edge', label: 'Drip Edge', unitPrice: 3, unit: 'LF', perSquare: false, quantity: 0, enabled: false },
  { key: 'flashing', label: 'Step Flashing / Re-flash', unitPrice: 280, unit: 'ea', perSquare: false, quantity: 1, enabled: false },
  { key: 'decking', label: 'Decking Replacement', unitPrice: 95, unit: 'sheets', perSquare: false, quantity: 0, enabled: false },
  { key: 'tearoff', label: 'Tear-Off (per layer)', unitPrice: 45, unit: 'squares', perSquare: true, enabled: false },
  { key: 'dumpster', label: 'Dumpster / Haul-Off', unitPrice: 450, unit: 'ea', perSquare: false, quantity: 1, enabled: false },
];

const STATUS_FLOW = ['DRAFT', 'PENDING_REVIEW', 'ESCALATED', 'APPROVED', 'SENT', 'ACCEPTED', 'DECLINED'];

const US_STATES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
  'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN',
  'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
};

function AddressAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleChange(e) {
    const v = e.target.value;
    onChange(v);
    clearTimeout(timerRef.current);
    if (v.length < 4) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=6&q=${encodeURIComponent(v)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        const items = data
          .filter(r => r.address?.house_number || r.address?.road)
          .slice(0, 5)
          .map(r => {
            const a = r.address;
            const street = [a.house_number, a.road].filter(Boolean).join(' ');
            const city = a.city || a.town || a.village || a.suburb || '';
            const stateAbbr = US_STATES[a.state] || a.state || '';
            const zip = a.postcode || '';
            return { street, city, state: stateAbbr, zip, display: r.display_name };
          })
          .filter(r => r.street);
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch {}
      setLoading(false);
    }, 350);
  }

  function handleSelect(item) {
    onSelect(item);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          className="forge-input w-full pr-7"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder || 'Start typing an address…'}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-elevated border border-border rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(s)}
              className="px-3 py-2.5 text-sm cursor-pointer hover:bg-white/5 transition-colors border-b border-border last:border-0"
            >
              <p className="text-text-primary font-medium">{s.street}</p>
              <p className="text-xs text-text-muted">{[s.city, s.state, s.zip].filter(Boolean).join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function calcSquares(facets) {
  let raw = 0;
  for (const f of facets) {
    const mult = PITCH_MULTIPLIERS[f.pitch] ?? 1.0;
    raw += (parseFloat(f.widthFt) || 0) * (parseFloat(f.lengthFt) || 0) * mult / 100;
  }
  return raw;
}

function calcTotals(facets, wastePercent, materialCostPerSq, laborCostPerSq, addOns) {
  const rawSquares = calcSquares(facets);
  const adjustedSquares = rawSquares * (1 + (wastePercent || 10) / 100);
  const lines = [
    { description: `Roofing Material — ${MATERIAL_PRESETS.find(m => m.key === addOns._materialKey)?.label || 'Selected Material'}`, quantity: adjustedSquares, unit: 'squares', unitPrice: materialCostPerSq, total: adjustedSquares * materialCostPerSq },
    { description: 'Installation Labor', quantity: adjustedSquares, unit: 'squares', unitPrice: laborCostPerSq, total: adjustedSquares * laborCostPerSq },
  ];
  for (const addon of addOns.items || []) {
    if (!addon.enabled) continue;
    const qty = addon.perSquare ? adjustedSquares : (parseFloat(addon.quantity) || 0);
    lines.push({ description: addon.label, quantity: qty, unit: addon.unit, unitPrice: addon.unitPrice, total: qty * addon.unitPrice });
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  return { rawSquares, adjustedSquares, lineItems: lines, subtotal, total: subtotal };
}

export default function RoofingQuoteBuilder() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { canManageData, user } = useAuth();
  const isNew = !id;

  const [tab, setTab] = useState('measurements');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [quote, setQuote] = useState(null);
  const [leads, setLeads] = useState([]);

  // Form state
  const [leadId, setLeadId] = useState('');
  const [propStreet, setPropStreet] = useState('');
  const [propStreet2, setPropStreet2] = useState('');
  const [propCity, setPropCity] = useState('');
  const [propState, setPropState] = useState('NJ');
  const [propZip, setPropZip] = useState('');
  const [roofType, setRoofType] = useState('gable');
  const [existingLayers, setExistingLayers] = useState(1);
  const [facets, setFacets] = useState([{ label: 'Main Roof', widthFt: '', lengthFt: '', pitch: '4/12' }]);
  const [wastePercent, setWastePercent] = useState(10);
  const [materialKey, setMaterialKey] = useState('architectural');
  const [materialCostPerSq, setMaterialCostPerSq] = useState(95);
  const [laborCostPerSq, setLaborCostPerSq] = useState(85);
  const [addOns, setAddOns] = useState(ADD_ON_PRESETS.map(a => ({ ...a })));
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [escalationNotes, setEscalationNotes] = useState('');

  // AI results
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    api.get('/leads').then(r => setLeads(r.data)).catch(() => {});
    if (!isNew) {
      loadQuote();
    } else {
      const preLeadId = searchParams.get('leadId');
      if (preLeadId) setLeadId(preLeadId);
    }
  }, [id]);

  async function loadQuote() {
    try {
      const r = await api.get(`/roofing-quotes/${id}`);
      const q = r.data;
      setQuote(q);
      setLeadId(q.leadId || '');
      setPropStreet(q.propStreet || q.propertyAddress || '');
      setPropStreet2(q.propStreet2 || '');
      setPropCity(q.propCity || '');
      setPropState(q.propState || 'NJ');
      setPropZip(q.propZip || '');
      setRoofType(q.roofType || 'gable');
      setExistingLayers(q.existingLayers || 1);
      setFacets(Array.isArray(q.facets) && q.facets.length > 0 ? q.facets : [{ label: 'Main Roof', widthFt: '', lengthFt: '', pitch: '4/12' }]);
      setWastePercent(q.wastePercent || 10);
      const preset = MATERIAL_PRESETS.find(m => m.key === q.materialType) || MATERIAL_PRESETS[0];
      setMaterialKey(q.materialType || 'architectural');
      setMaterialCostPerSq(q.materialCostPerSq || preset.materialCost);
      setLaborCostPerSq(q.laborCostPerSq || preset.laborCost);
      setNotes(q.notes || '');
      setStatus(q.status || 'DRAFT');
      setEscalationNotes(q.escalationNotes || '');
      if (q.aiAnalysis || (q.aiFlags && q.aiFlags.length) || (q.escalationReasons && q.escalationReasons.length)) {
        setAiResult({
          aiAnalysis: q.aiAnalysis,
          aiFlags: q.aiFlags || [],
          escalationReasons: q.escalationReasons || [],
          escalated: q.escalated,
          aiConfidence: q.aiConfidence,
        });
      }
    } catch { toast.error('Failed to load quote'); navigate('/roofing-quotes'); }
  }

  function onMaterialChange(key) {
    setMaterialKey(key);
    const preset = MATERIAL_PRESETS.find(m => m.key === key);
    if (preset && key !== 'custom') {
      setMaterialCostPerSq(preset.materialCost);
      setLaborCostPerSq(preset.laborCost);
    }
  }

  function addFacet() {
    setFacets(prev => [...prev, { label: `Facet ${prev.length + 1}`, widthFt: '', lengthFt: '', pitch: '4/12' }]);
  }

  function removeFacet(i) {
    setFacets(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateFacet(i, field, val) {
    setFacets(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  }

  function toggleAddOn(i) {
    setAddOns(prev => prev.map((a, idx) => idx === i ? { ...a, enabled: !a.enabled } : a));
  }

  function updateAddOn(i, field, val) {
    setAddOns(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  }

  const totals = calcTotals(facets, wastePercent, materialCostPerSq, laborCostPerSq, { _materialKey: materialKey, items: addOns });

  function buildPayload() {
    const propertyAddress = [propStreet, propStreet2, propCity && propState ? `${propCity}, ${propState}` : propCity || propState, propZip].filter(Boolean).join(' ');
    return {
      leadId: leadId || null,
      propertyAddress,
      propStreet,
      propStreet2,
      propCity,
      propState,
      propZip,
      roofType,
      existingLayers: parseInt(existingLayers),
      facets,
      totalSquares: totals.rawSquares,
      wastePercent: parseFloat(wastePercent),
      adjustedSquares: totals.adjustedSquares,
      materialType: materialKey,
      materialCostPerSq: parseFloat(materialCostPerSq),
      laborCostPerSq: parseFloat(laborCostPerSq),
      lineItems: totals.lineItems,
      subtotal: totals.subtotal,
      total: totals.total,
      notes,
      status,
      escalationNotes,
      ...(aiResult ? {
        aiAnalysis: aiResult.aiAnalysis || null,
        aiFlags: aiResult.aiFlags || [],
        aiConfidence: aiResult.aiConfidence ?? null,
        escalated: aiResult.escalated || false,
        escalationReasons: aiResult.escalationReasons || [],
      } : {}),
    };
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const payload = {
        ...buildPayload(),
        total: totals.total,
        adjustedSquares: totals.adjustedSquares,
        totalSquares: totals.rawSquares,
      };
      const r = await api.post('/roofing-quotes/analyze', payload);
      setAiResult(r.data);
      if (r.data.escalated) {
        toast.error(`Quote escalated — ${r.data.escalationReasons.length} flag(s) require review`, { duration: 5000 });
        setStatus('ESCALATED');
      } else {
        toast.success('Analysis complete — no escalation flags');
      }
      if (r.data.recommendedWastePct && r.data.recommendedWastePct !== wastePercent) {
        toast(`AI recommends ${r.data.recommendedWastePct}% waste factor`, { icon: '💡' });
      }
      setTab('review');
    } catch { toast.error('Analysis failed'); }
    setAnalyzing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isNew) {
        const r = await api.post('/roofing-quotes', payload);
        toast.success(`Quote ${r.data.number} saved`);
        navigate(`/roofing-quotes/${r.data.id}`, { replace: true });
      } else {
        await api.patch(`/roofing-quotes/${id}`, payload);
        toast.success('Quote updated');
        loadQuote();
      }
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  }

  async function handleApprove() {
    try {
      await api.patch(`/roofing-quotes/${id}/approve`, { escalationNotes });
      toast.success('Quote approved');
      loadQuote();
    } catch { toast.error('Failed to approve'); }
  }

  const canApprove = !isNew && quote?.escalated && ['ESCALATED', 'PENDING_REVIEW'].includes(quote?.status);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/roofing-quotes" className="text-text-muted hover:text-text-primary text-sm transition-colors">← Quotes</Link>
          <span className="text-border">|</span>
          <div>
            <h1 className="text-lg font-bold text-text-primary">
              {isNew ? 'New Roofing Quote' : quote?.number || '…'}
            </h1>
            {(propStreet || propCity) && (
              <p className="text-xs text-text-muted">{[propStreet, propCity && propState ? `${propCity}, ${propState}` : propCity, propZip].filter(Boolean).join(' ')}</p>
            )}
          </div>
          {!isNew && quote && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
              quote.status === 'ESCALATED' ? 'bg-red-500/15 text-red-400' :
              quote.status === 'APPROVED' ? 'bg-green-500/15 text-green-400' :
              quote.status === 'ACCEPTED' ? 'bg-emerald-500/15 text-emerald-400' :
              quote.status === 'SENT' ? 'bg-blue-500/15 text-blue-400' :
              'bg-gray-500/15 text-gray-400'
            }`}>{quote.status.replace(/_/g, ' ')}</span>
          )}
          {aiResult?.escalated && (
            <span className="text-[11px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              ⚠ Escalated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <p className="text-xs text-text-muted">Estimated Total</p>
            <p className="text-xl font-black text-accent">${totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          {canManageData && (
            <button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : isNew ? 'Create Quote' : 'Save Changes'}
            </button>
          )}
          {canApprove && (
            <button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Approve
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0 px-6">
        {[
          { key: 'measurements', label: '📐 Measurements' },
          { key: 'pricing', label: '$ Pricing' },
          { key: 'review', label: aiResult?.escalated ? '⚠ Review & AI' : '🤖 Review & AI' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── MEASUREMENTS TAB ── */}
        {tab === 'measurements' && (
          <div className="max-w-3xl space-y-6">
            {/* Property info */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Property Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-text-muted mb-1 block">Street Address</label>
                  <AddressAutocomplete
                    value={propStreet}
                    onChange={setPropStreet}
                    onSelect={s => {
                      setPropStreet(s.street);
                      if (s.city) setPropCity(s.city);
                      if (s.state) setPropState(s.state);
                      if (s.zip) setPropZip(s.zip);
                    }}
                    placeholder="123 Main St — start typing to search"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-text-muted mb-1 block">Street Address 2 <span className="text-text-muted font-normal">(Apt, Suite, Unit)</span></label>
                  <input className="forge-input" value={propStreet2} onChange={e => setPropStreet2(e.target.value)} placeholder="Apt 4B, Suite 100, etc." />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">City</label>
                  <input className="forge-input" value={propCity} onChange={e => setPropCity(e.target.value)} placeholder="Newark" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">State</label>
                    <select className="forge-input" value={propState} onChange={e => setPropState(e.target.value)}>
                      {Object.entries(US_STATES).map(([name, abbr]) => (
                        <option key={abbr} value={abbr}>{abbr} — {name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">ZIP Code</label>
                    <input className="forge-input" value={propZip} onChange={e => setPropZip(e.target.value)} placeholder="07102" maxLength={10} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Linked Lead (optional)</label>
                  <select className="forge-input" value={leadId} onChange={e => setLeadId(e.target.value)}>
                    <option value="">— No linked lead —</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} {l.city ? `· ${l.city}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Roof Type</label>
                  <select className="forge-input" value={roofType} onChange={e => setRoofType(e.target.value)}>
                    {['gable','hip','gambrel','mansard','shed','flat','complex'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Existing Layers</label>
                  <select className="forge-input" value={existingLayers} onChange={e => setExistingLayers(e.target.value)}>
                    <option value={1}>1 layer (standard)</option>
                    <option value={2}>2 layers ⚠ double tear-off</option>
                    <option value={3}>3 layers ⛔ requires assessment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Waste Factor (%)</label>
                  <input className="forge-input" type="number" min={5} max={30} value={wastePercent} onChange={e => setWastePercent(e.target.value)} />
                  <p className="text-xs text-text-muted mt-1">10% standard · 15% complex cuts · 20%+ hip/complex</p>
                </div>
              </div>
            </div>

            {/* Roof facets */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Roof Facets</h2>
                <p className="text-xs text-text-muted">1 square = 100 sq ft of flat area</p>
              </div>

              <div className="space-y-3">
                {facets.map((f, i) => {
                  const mult = PITCH_MULTIPLIERS[f.pitch] ?? 1.0;
                  const sq = ((parseFloat(f.widthFt) || 0) * (parseFloat(f.lengthFt) || 0) * mult / 100);
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center bg-bg-elevated border border-border rounded-lg p-3">
                      <div className="col-span-3">
                        <label className="text-xs text-text-muted mb-1 block">Label</label>
                        <input className="forge-input text-sm" value={f.label} onChange={e => updateFacet(i, 'label', e.target.value)} placeholder={`Facet ${i + 1}`} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-text-muted mb-1 block">Width (ft)</label>
                        <input className="forge-input text-sm" type="number" min={0} value={f.widthFt} onChange={e => updateFacet(i, 'widthFt', e.target.value)} placeholder="0" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-text-muted mb-1 block">Length (ft)</label>
                        <input className="forge-input text-sm" type="number" min={0} value={f.lengthFt} onChange={e => updateFacet(i, 'lengthFt', e.target.value)} placeholder="0" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-text-muted mb-1 block">Pitch</label>
                        <select className="forge-input text-sm" value={f.pitch} onChange={e => updateFacet(i, 'pitch', e.target.value)}>
                          {PITCH_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-text-muted mb-1 block">Squares</label>
                        <div className="forge-input text-sm bg-bg-primary text-accent font-semibold">{sq.toFixed(2)}</div>
                      </div>
                      <div className="col-span-1 pt-5 text-right">
                        {facets.length > 1 && (
                          <button onClick={() => removeFacet(i)} className="text-text-muted hover:text-red-400 text-sm w-6 h-6 flex items-center justify-center ml-auto">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={addFacet} className="text-sm text-accent hover:text-accent-hover border border-accent/30 hover:border-accent/60 px-4 py-2 rounded-lg transition-colors">
                + Add Facet
              </button>

              {/* Totals summary */}
              <div className="bg-bg-elevated border border-border rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-text-muted text-xs">Raw Squares</p>
                  <p className="font-bold text-text-primary text-lg">{totals.rawSquares.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Waste ({wastePercent}%)</p>
                  <p className="font-bold text-text-secondary text-lg">+{(totals.adjustedSquares - totals.rawSquares).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Adjusted Squares</p>
                  <p className="font-bold text-accent text-lg">{totals.adjustedSquares.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRICING TAB ── */}
        {tab === 'pricing' && (
          <div className="max-w-3xl space-y-6">
            {/* Material */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Material Selection</h2>
              <div className="grid grid-cols-2 gap-2">
                {MATERIAL_PRESETS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => onMaterialChange(m.key)}
                    className={`text-left px-4 py-3 rounded-lg border transition-all ${
                      materialKey === m.key
                        ? 'border-accent bg-accent/10 text-text-primary'
                        : 'border-border bg-bg-elevated text-text-secondary hover:border-border-focus hover:text-text-primary'
                    }`}
                  >
                    <p className="text-sm font-medium">{m.label}</p>
                    {m.key !== 'custom' && (
                      <p className="text-xs text-text-muted mt-0.5">${m.materialCost}/sq material · ${m.laborCost}/sq labor</p>
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Material Cost ($/sq)</label>
                  <input className="forge-input" type="number" min={0} value={materialCostPerSq} onChange={e => setMaterialCostPerSq(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Labor Cost ($/sq)</label>
                  <input className="forge-input" type="number" min={0} value={laborCostPerSq} onChange={e => setLaborCostPerSq(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Add-ons */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Add-Ons & Accessories</h2>
              <div className="space-y-2">
                {addOns.map((a, i) => (
                  <div key={a.key} className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${a.enabled ? 'border-accent/30 bg-accent/5' : 'border-border bg-bg-elevated'}`}>
                    <input type="checkbox" checked={a.enabled} onChange={() => toggleAddOn(i)} className="accent-accent w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${a.enabled ? 'text-text-primary' : 'text-text-secondary'}`}>{a.label}</p>
                      <p className="text-xs text-text-muted">${a.unitPrice}/{a.unit} {a.perSquare ? '· applied per square' : ''}</p>
                    </div>
                    {a.enabled && !a.perSquare && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted">Qty:</label>
                        <input className="forge-input text-sm w-20" type="number" min={0} value={a.quantity || ''} onChange={e => updateAddOn(i, 'quantity', e.target.value)} />
                      </div>
                    )}
                    {a.enabled && (
                      <div className="text-right min-w-[80px]">
                        <p className="text-sm font-semibold text-accent">
                          ${(a.perSquare ? totals.adjustedSquares * a.unitPrice : (parseFloat(a.quantity) || 0) * a.unitPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Line items preview */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Line Items</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-text-muted border-b border-border">
                    <th className="text-left pb-2">Description</th>
                    <th className="text-right pb-2">Qty</th>
                    <th className="text-right pb-2">Unit</th>
                    <th className="text-right pb-2">$/Unit</th>
                    <th className="text-right pb-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {totals.lineItems.map((l, i) => (
                    <tr key={i}>
                      <td className="py-2 text-text-secondary">{l.description}</td>
                      <td className="py-2 text-right text-text-muted">{l.quantity.toFixed(2)}</td>
                      <td className="py-2 text-right text-text-muted">{l.unit}</td>
                      <td className="py-2 text-right text-text-muted">${l.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="py-2 text-right font-semibold text-text-primary">${l.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-accent/30">
                    <td colSpan={4} className="pt-3 text-sm font-bold text-text-primary">TOTAL</td>
                    <td className="pt-3 text-right text-xl font-black text-accent">${totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Internal Notes</h2>
              <textarea className="forge-input w-full h-24 resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Scope notes, special conditions, customer preferences…" />
            </div>
          </div>
        )}

        {/* ── REVIEW & AI TAB ── */}
        {tab === 'review' && (
          <div className="max-w-3xl space-y-6">
            {/* Run Analysis CTA */}
            <div className="bg-bg-card border border-border rounded-xl p-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary">AI Measurement Analysis</h2>
                <p className="text-xs text-text-muted mt-0.5">Claude reviews your measurements for inconsistencies, flags escalations, and suggests adjustments.</p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || facets.every(f => !f.widthFt || !f.lengthFt)}
                className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 min-w-[140px] justify-center"
              >
                {analyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : '🤖 Run Analysis'}
              </button>
            </div>

            {/* Escalation status */}
            {aiResult && (
              <>
                <div className={`rounded-xl border p-5 ${aiResult.escalated ? 'bg-red-500/5 border-red-500/30' : 'bg-green-500/5 border-green-500/30'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{aiResult.escalated ? '⚠️' : '✅'}</span>
                    <div>
                      <h3 className={`font-bold ${aiResult.escalated ? 'text-red-400' : 'text-green-400'}`}>
                        {aiResult.escalated ? 'Quote Escalated — Manager Review Required' : 'No Escalation Flags'}
                      </h3>
                      {aiResult.aiConfidence !== null && aiResult.aiConfidence !== undefined && (
                        <p className="text-xs text-text-muted">AI Confidence: {aiResult.aiConfidence}%</p>
                      )}
                    </div>
                  </div>

                  {aiResult.escalationReasons?.length > 0 && (
                    <div className="space-y-1.5">
                      {aiResult.escalationReasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 rounded-lg px-3 py-2">
                          <span className="flex-shrink-0 mt-0.5">⚠</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Analysis */}
                {aiResult.aiAnalysis && (
                  <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">🤖 AI Assessment</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{aiResult.aiAnalysis}</p>
                  </div>
                )}

                {/* Measurement flags */}
                {aiResult.aiFlags?.length > 0 && (
                  <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary">Measurement Flags</h3>
                    <div className="space-y-2">
                      {aiResult.aiFlags.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-yellow-300 bg-yellow-500/10 rounded-lg px-3 py-2">
                          <span className="flex-shrink-0">⚡</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {aiResult.suggestions?.length > 0 && (
                  <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary">Suggestions</h3>
                    <ul className="space-y-1.5">
                      {aiResult.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-accent flex-shrink-0">→</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Escalation notes & approval */}
                {aiResult.escalated && (
                  <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary">Escalation Notes</h3>
                    <textarea
                      className="forge-input w-full h-24 resize-none"
                      value={escalationNotes}
                      onChange={e => setEscalationNotes(e.target.value)}
                      placeholder="Add notes about the escalation, site visit findings, or manager approval comments…"
                    />
                    {!isNew && canApprove && (
                      <button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                        Approve & Override Escalation
                      </button>
                    )}
                  </div>
                )}

                {/* Thresholds reference */}
                {aiResult.thresholds && (
                  <div className="bg-bg-elevated border border-border rounded-xl p-4">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Auto-Escalation Thresholds</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                      <div>Adjusted squares &gt; <span className="text-text-primary font-semibold">{aiResult.thresholds.maxSquares}</span></div>
                      <div>Steepest pitch &gt; <span className="text-text-primary font-semibold">{aiResult.thresholds.maxPitchOver}/12</span></div>
                      <div>Quote total &gt; <span className="text-text-primary font-semibold">${aiResult.thresholds.maxQuoteValue.toLocaleString()}</span></div>
                      <div>Existing layers ≥ <span className="text-text-primary font-semibold">{aiResult.thresholds.maxExistingLayers}</span></div>
                      <div>AI confidence &lt; <span className="text-text-primary font-semibold">{aiResult.thresholds.minAIConfidence}%</span></div>
                    </div>
                  </div>
                )}
              </>
            )}

            {!aiResult && (
              <div className="bg-bg-elevated border border-border rounded-xl p-8 text-center">
                <p className="text-4xl mb-3">🏠</p>
                <p className="text-text-secondary text-sm">Enter measurements and pricing, then run AI analysis to check for escalation flags.</p>
              </div>
            )}

            {/* Status control */}
            {!isNew && canManageData && (
              <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Quote Status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                        status === s ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted hover:border-border-focus hover:text-text-secondary'
                      }`}
                    >
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

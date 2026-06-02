import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const PAYOUT_COLORS = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  APPROVED: 'bg-blue-500/15 text-blue-400',
  PAID: 'bg-green-500/15 text-green-400',
  DISPUTED: 'bg-red-500/15 text-red-400',
};

export default function CommissionPage() {
  const [rules, setRules] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payouts');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: '', roleTarget: 'REP', type: 'PERCENTAGE', rate: '', bonusThreshold: '', bonusRate: '' });
  const { isOwner } = useAuth();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [rulesR, payoutsR, summaryR] = await Promise.all([
        api.get('/commission/rules'),
        api.get('/commission/payouts'),
        api.get('/commission/summary'),
      ]);
      setRules(rulesR.data);
      setPayouts(payoutsR.data);
      setSummary(summaryR.data);
    } catch { toast.error('Failed to load commission data'); }
    finally { setLoading(false); }
  }

  async function handleCreateRule(e) {
    e.preventDefault();
    try {
      await api.post('/commission/rules', ruleForm);
      toast.success('Rule created');
      setShowRuleModal(false);
      setRuleForm({ name: '', roleTarget: 'REP', type: 'PERCENTAGE', rate: '', bonusThreshold: '', bonusRate: '' });
      loadAll();
    } catch { toast.error('Failed to create rule'); }
  }

  async function handleUpdatePayoutStatus(id, status) {
    try {
      await api.patch(`/commission/payouts/${id}/status`, { status });
      toast.success(`Payout marked as ${status}`);
      loadAll();
    } catch { toast.error('Failed to update payout'); }
  }

  if (loading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>;
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Commission</h1>
        {isOwner && <button onClick={() => setShowRuleModal(true)} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ New Rule</button>}
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Pending', value: `$${summary.totalPending.toLocaleString()}`, color: 'text-yellow-400' },
            { label: 'Approved', value: `$${summary.totalApproved.toLocaleString()}`, color: 'text-blue-400' },
            { label: 'Paid Out', value: `$${summary.totalPaid.toLocaleString()}`, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['payouts', 'rules'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all capitalize ${activeTab === tab ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'payouts' && (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Rep', 'Rule', 'Amount', 'Period', 'Status', 'Deal', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-text-muted py-10 text-sm">No payouts yet</td></tr>
              ) : payouts.map(p => (
                <tr key={p.id} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{p.salesRep.name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.rule.name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary">${p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{p.period}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYOUT_COLORS[p.status]}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-xs text-text-muted">{p.deal ? `$${p.deal.revenue.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3">
                    {isOwner && p.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdatePayoutStatus(p.id, 'APPROVED')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Approve</button>
                      </div>
                    )}
                    {isOwner && p.status === 'APPROVED' && (
                      <button onClick={() => handleUpdatePayoutStatus(p.id, 'PAID')} className="text-xs text-green-400 hover:text-green-300 transition-colors">Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rules.length === 0 ? (
            <p className="text-text-muted text-sm col-span-2 text-center py-8">No commission rules set up</p>
          ) : rules.map(r => (
            <div key={r.id} className={`bg-bg-card border rounded-xl p-4 ${r.isActive ? 'border-border' : 'border-border opacity-50'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-text-primary">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-bg-elevated px-2 py-0.5 rounded text-text-muted">{r.roleTarget}</span>
                    <span className="text-xs bg-bg-elevated px-2 py-0.5 rounded text-text-muted">{r.type}</span>
                  </div>
                </div>
                {!r.isActive && <span className="text-xs text-red-400">Inactive</span>}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Base Rate</span>
                  <span className="text-accent font-semibold">{r.type === 'PERCENTAGE' ? `${(r.rate * 100).toFixed(1)}%` : `$${r.rate}`}</span>
                </div>
                {r.bonusThreshold && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Bonus over ${r.bonusThreshold.toLocaleString()}</span>
                    <span className="text-green-400 font-semibold">+{(r.bonusRate * 100).toFixed(1)}%</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>{r._count?.payouts || 0} payouts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRuleModal && (
        <Modal title="New Commission Rule" onClose={() => setShowRuleModal(false)}>
          <form onSubmit={handleCreateRule} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Rule Name *</label>
              <input className="forge-input" required value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} placeholder="Standard Rep Commission" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Role Target</label>
                <select className="forge-input" value={ruleForm.roleTarget} onChange={e => setRuleForm(f => ({ ...f, roleTarget: e.target.value }))}>
                  <option>REP</option><option>MANAGER</option><option>OWNER</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Type</label>
                <select className="forge-input" value={ruleForm.type} onChange={e => setRuleForm(f => ({ ...f, type: e.target.value }))}>
                  <option>PERCENTAGE</option><option>FLAT</option><option>TIERED</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Rate {ruleForm.type === 'PERCENTAGE' ? '(e.g. 0.08 for 8%)' : '($)'}</label>
              <input className="forge-input" type="number" required step="0.001" min="0" value={ruleForm.rate} onChange={e => setRuleForm(f => ({ ...f, rate: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Bonus Threshold ($)</label>
                <input className="forge-input" type="number" min="0" value={ruleForm.bonusThreshold} onChange={e => setRuleForm(f => ({ ...f, bonusThreshold: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Bonus Rate (e.g. 0.02)</label>
                <input className="forge-input" type="number" step="0.001" min="0" value={ruleForm.bonusRate} onChange={e => setRuleForm(f => ({ ...f, bonusRate: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowRuleModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Create Rule</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

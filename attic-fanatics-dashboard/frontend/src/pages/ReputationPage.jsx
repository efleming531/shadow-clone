import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';

const STARS = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
const PLATFORM_COLORS = { Google: 'text-blue-400', Yelp: 'text-red-400', Facebook: 'text-blue-500' };

export default function ReputationPage() {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ platform: 'Google', rating: 5, reviewText: '', reviewDate: new Date().toISOString().split('T')[0] });
  const { canManageData } = useAuth();

  useEffect(() => { loadAll(); }, [ratingFilter, platformFilter]);

  async function loadAll() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ratingFilter) params.append('rating', ratingFilter);
      if (platformFilter) params.append('platform', platformFilter);

      const [statsR, reviewsR] = await Promise.all([
        api.get('/reputation/stats'),
        api.get(`/reputation/reviews?${params}`),
      ]);
      setStats(statsR.data);
      setReviews(reviewsR.data);
    } catch { toast.error('Failed to load reputation data'); }
    finally { setLoading(false); }
  }

  async function handleRespond(id) {
    try {
      await api.patch(`/reputation/reviews/${id}/respond`, { responseText });
      toast.success('Response saved');
      setRespondingTo(null);
      setResponseText('');
      loadAll();
    } catch { toast.error('Failed to save response'); }
  }

  async function handleAddReview(e) {
    e.preventDefault();
    try {
      await api.post('/reputation/reviews', addForm);
      toast.success('Review added');
      setShowAddModal(false);
      setAddForm({ platform: 'Google', rating: 5, reviewText: '', reviewDate: new Date().toISOString().split('T')[0] });
      loadAll();
    } catch { toast.error('Failed to add review'); }
  }

  const platforms = stats ? Object.keys(stats.byPlatform) : [];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Reputation</h1>
        {canManageData && (
          <button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ Add Review</button>
        )}
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.avgRating.toFixed(1)}</p>
              <p className="text-yellow-400 text-sm">{STARS(Math.round(stats.avgRating))}</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-text-primary">{stats.total}</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">Response Rate</p>
              <p className="text-3xl font-bold text-green-400">{(stats.responseRate * 100).toFixed(0)}%</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-2">By Platform</p>
              <div className="space-y-1">
                {platforms.map(p => (
                  <div key={p} className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${PLATFORM_COLORS[p] || 'text-text-secondary'}`}>{p}</span>
                    <span className="text-xs text-text-muted">{stats.byPlatform[p].count} · {stats.byPlatform[p].avg.toFixed(1)}★</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1">
                {[5, 4, 3, 2, 1].map(r => (
                  <button key={r} onClick={() => setRatingFilter(ratingFilter == r ? '' : r)} className={`px-2 py-1 text-xs rounded border transition-all ${ratingFilter == r ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'}`}>
                    {r}★
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {['', ...platforms].map(p => (
                  <button key={p} onClick={() => setPlatformFilter(p)} className={`px-2 py-1 text-xs rounded border transition-all ${platformFilter === p ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'}`}>
                    {p || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">No reviews found</div>
          ) : reviews.map(r => (
            <div key={r.id} className="bg-bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-yellow-400">{STARS(r.rating)}</span>
                    <span className={`text-xs font-medium ${PLATFORM_COLORS[r.platform] || 'text-text-secondary'}`}>{r.platform}</span>
                    <span className="text-xs text-text-muted">{new Date(r.reviewDate).toLocaleDateString()}</span>
                    {r.customer && <span className="text-xs text-text-muted">— {r.customer.name}</span>}
                  </div>
                  {r.reviewText && <p className="text-sm text-text-secondary">{r.reviewText}</p>}
                  {r.responded && r.responseText && (
                    <div className="mt-3 pl-3 border-l-2 border-accent/30">
                      <p className="text-xs text-accent mb-0.5">Your response:</p>
                      <p className="text-xs text-text-secondary">{r.responseText}</p>
                    </div>
                  )}
                </div>
                {!r.responded && canManageData && (
                  <button onClick={() => setRespondingTo(r.id)} className="text-xs text-accent hover:text-accent-hover ml-4 flex-shrink-0 transition-colors">Respond</button>
                )}
                {r.responded && <span className="text-xs text-green-400 ml-4 flex-shrink-0">Responded ✓</span>}
              </div>

              {respondingTo === r.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <textarea className="forge-input resize-none mb-2" rows={3} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Type your response..." />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setRespondingTo(null)} className="text-xs text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
                    <button onClick={() => handleRespond(r.id)} className="text-xs bg-accent hover:bg-accent-hover text-white px-3 py-1 rounded transition-colors">Save Response</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <Modal title="Add Review" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddReview} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Platform</label>
                <select className="forge-input" value={addForm.platform} onChange={e => setAddForm(f => ({ ...f, platform: e.target.value }))}>
                  <option>Google</option><option>Yelp</option><option>Facebook</option><option>BBB</option><option>Houzz</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Rating</label>
                <select className="forge-input" value={addForm.rating} onChange={e => setAddForm(f => ({ ...f, rating: parseInt(e.target.value) }))}>
                  {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Review Date</label>
              <input className="forge-input" type="date" value={addForm.reviewDate} onChange={e => setAddForm(f => ({ ...f, reviewDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Review Text</label>
              <textarea className="forge-input resize-none" rows={3} value={addForm.reviewText} onChange={e => setAddForm(f => ({ ...f, reviewText: e.target.value }))} placeholder="Review content..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">Add Review</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

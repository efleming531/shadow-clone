import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const JOB_STATUS_COLORS = {
  SCHEDULED: 'text-blue-400',
  IN_PROGRESS: 'text-yellow-400',
  COMPLETED: 'text-green-400',
  ON_HOLD: 'text-orange-400',
  CANCELLED: 'text-red-400',
};

const MEMBERSHIP_STATUS_COLORS = {
  ACTIVE: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  EXPIRED: 'bg-gray-500/15 text-gray-400',
  PAUSED: 'bg-yellow-500/15 text-yellow-400',
};

const STARS = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customers/${id}`)
      .then(r => setCustomer(r.data))
      .catch(() => { toast.error('Customer not found'); navigate('/customers'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-bg-card rounded-xl border border-border animate-pulse" />)}</div>;
  }

  if (!customer) return null;

  const totalRevenue = customer.jobs.reduce((s, j) => s + j.totalRevenue, 0);
  const avgRating = customer.reviews.length > 0 ? customer.reviews.reduce((s, r) => s + r.rating, 0) / customer.reviews.length : null;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link to="/customers" className="hover:text-text-primary transition-colors">Customers</Link>
        <span>›</span>
        <span className="text-text-primary">{customer.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{customer.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
            {customer.phone && <span>{customer.phone}</span>}
            {customer.email && <span>{customer.email}</span>}
            {customer.city && <span>{customer.city}, {customer.state}</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-accent">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-text-muted">lifetime value</p>
          {avgRating && <p className="text-yellow-400 text-sm mt-1">{STARS(Math.round(avgRating))} {avgRating.toFixed(1)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Jobs ({customer.jobs.length})</h3>
              <Link to="/jobs" className="text-xs text-accent hover:text-accent-hover">View all</Link>
            </div>
            {customer.jobs.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No jobs yet</p>
            ) : (
              <div className="space-y-2">
                {customer.jobs.map(j => (
                  <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg hover:bg-bg-hover transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{j.jobNumber}</p>
                      <p className="text-xs text-text-muted">{j.serviceType} · {j.scheduledDate ? new Date(j.scheduledDate).toLocaleDateString() : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${JOB_STATUS_COLORS[j.status]}`}>{j.status.replace('_', ' ')}</p>
                      <p className="text-sm font-semibold text-text-primary">${j.totalRevenue.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {customer.reviews.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Reviews ({customer.reviews.length})</h3>
              <div className="space-y-3">
                {customer.reviews.map(r => (
                  <div key={r.id} className="p-3 bg-bg-elevated rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-400 text-sm">{STARS(r.rating)}</span>
                      <span className="text-xs text-text-muted">{r.platform}</span>
                      <span className="text-xs text-text-muted">{new Date(r.reviewDate).toLocaleDateString()}</span>
                    </div>
                    {r.reviewText && <p className="text-sm text-text-secondary">{r.reviewText}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Memberships + Contact */}
        <div className="space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Memberships</h3>
            {customer.memberships.length === 0 ? (
              <div>
                <p className="text-sm text-text-muted mb-2">Not a member</p>
                <Link to="/membership" className="text-xs text-accent hover:text-accent-hover">Enroll →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {customer.memberships.map(m => (
                  <div key={m.id} className="p-3 bg-bg-elevated rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{m.plan.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${MEMBERSHIP_STATUS_COLORS[m.status]}`}>{m.status}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">${m.plan.price}/{m.plan.billingCycle.toLowerCase()}</p>
                    {m.renewalDate && <p className="text-xs text-text-muted">Renews {new Date(m.renewalDate).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Contact</h3>
            <div className="space-y-2 text-sm">
              {customer.address && <p className="text-text-secondary">{customer.address}</p>}
              {customer.city && <p className="text-text-secondary">{customer.city}, {customer.state} {customer.zip}</p>}
              {customer.phone && <a href={`tel:${customer.phone}`} className="block text-accent hover:text-accent-hover">{customer.phone}</a>}
              {customer.email && <a href={`mailto:${customer.email}`} className="block text-accent hover:text-accent-hover truncate">{customer.email}</a>}
            </div>
          </div>

          {customer.notes && (
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-text-secondary">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

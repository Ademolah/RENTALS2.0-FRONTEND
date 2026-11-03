import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

const StarRow = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <i key={s} className={`fa-solid fa-star text-xs ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`} />
    ))}
  </div>
);

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('written');
  const [showWriteModal, setShowWriteModal] = useState(null);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [reviewsRes, bookingsRes] = await Promise.allSettled([
          apiClient.get('/reviews/my-reviews'),
          apiClient.get('/reservations/my-bookings'),
        ]);

        if (reviewsRes.status === 'fulfilled') {
          const d = reviewsRes.value.data;
          setReviews(Array.isArray(d) ? d : d?.data?.reviews || d?.reviews || d?.data || []);
        }

        if (bookingsRes.status === 'fulfilled') {
          const d = bookingsRes.value.data;
          const all = Array.isArray(d) ? d : d?.data?.reservations || d?.reservations || d?.data || [];
          // Pending = completed, non-car, not yet reviewed
          const reviewedIds = new Set((reviewsRes.value?.data?.data?.reviews || []).map(r => r.propertyId || r.listingId));
          setPending(all.filter(b =>
            b.status === 'COMPLETED' &&
            !b._source?.includes('car') &&
            !reviewedIds.has(b.propertyId || b.listingId)
          ));
        }
      } catch {
        // proceed with empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim() || !showWriteModal) return;
    setSubmitting(true);
    try {
      const propId = showWriteModal.propertyId || showWriteModal.listingId;
      if (propId) {
        await apiClient.post(`/reviews/${propId}`, { rating: form.rating, comment: form.comment });
        setPending(prev => prev.filter(b => (b.propertyId || b.listingId) !== propId));
        setReviews(prev => [{
          _id: Date.now(),
          propertyTitle: showWriteModal.listingTitle,
          rating: form.rating,
          comment: form.comment,
          createdAt: new Date().toISOString()
        }, ...prev]);
      }
      setShowWriteModal(null);
      setForm({ rating: 5, comment: '' });
      setActiveTab('written');
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/dashboard/guest" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6 transition-colors">
        <i className="fa-solid fa-arrow-left text-sm" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-6">My Reviews</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {[
          { id: 'written', label: 'Written reviews' },
          { id: 'pending', label: `Pending${pending.length > 0 ? ` (${pending.length})` : ''}` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 text-sm font-bold transition-colors border-b-2 -mb-px ${activeTab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-2xl mr-3" />
          <span className="font-medium">Loading reviews...</span>
        </div>
      ) : activeTab === 'written' ? (
        reviews.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <i className="fa-solid fa-star text-3xl text-gray-200 mb-3 block" />
            <h3 className="font-bold text-gray-700">No reviews yet</h3>
            <p className="text-sm text-gray-400 mt-1">Complete a stay to leave your first review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r._id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{r.propertyTitle || r.property?.title || 'Property'}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(r.createdAt)}</p>
                  </div>
                  <StarRow rating={r.rating} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{r.comment || r.review}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        pending.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <i className="fa-solid fa-check-circle text-3xl text-gray-200 mb-3 block" />
            <h3 className="font-bold text-gray-700">All reviewed!</h3>
            <p className="text-sm text-gray-400 mt-1">You have reviewed all your completed stays.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(b => (
              <div key={b._id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
                {b.image && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img src={b.image} alt={b.listingTitle} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{b.listingTitle || 'Your stay'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {b.checkInDate ? new Date(b.checkInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>
                </div>
                <button
                  onClick={() => { setShowWriteModal(b); setForm({ rating: 5, comment: '' }); }}
                  className="shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-xl font-bold text-sm transition-colors"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Write review modal */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Review your stay</h3>
              <button onClick={() => setShowWriteModal(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <i className="fa-solid fa-xmark text-base" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4"><strong>{showWriteModal.listingTitle}</strong></p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, rating: s }))}
                      className={`text-2xl transition-colors ${s <= form.rating ? 'text-amber-400' : 'text-gray-200'}`}>
                      <i className="fa-solid fa-star" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Your review</label>
                <textarea
                  value={form.comment}
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  placeholder="Tell others about your experience..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !form.comment.trim()}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

import { useEffect, useState } from 'react';
import { Star, MessageSquare, ArrowRight } from 'lucide-react';
import { Card, Button, Skeleton } from '../ui';
import { getListingReviews } from '../../api/reviews';

export function Stars({ value, className = 'w-4 h-4' }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${className} ${value >= s - 0.25 ? 'fill-brand-star text-brand-star' : 'fill-transparent text-gray-300'}`} />
      ))}
    </div>
  );
}

export function ReviewSummary({ summary }) {
  return (
    <Card className="p-6 md:p-8 grid md:grid-cols-[auto_1fr] gap-8 items-center">
      <div className="text-center md:text-left">
        <p className="text-6xl font-display font-bold text-brand-dark leading-none">{summary.average.toFixed(1)}</p>
        <div className="mt-3 flex justify-center md:justify-start"><Stars value={summary.average} className="w-5 h-5" /></div>
        <p className="mt-2 text-base text-brand-text-secondary">{summary.count} review{summary.count !== 1 ? 's' : ''}</p>
      </div>
      <div className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const pct = summary.count ? (summary.distribution[n] / summary.count) * 100 : 0;
          return (
            <div key={n} className="flex items-center gap-3 text-base">
              <span className="w-4 font-semibold text-brand-dark">{n}</span>
              <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-brand-star rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right text-brand-text-muted">{summary.distribution[n]}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function ReviewCard({ review }) {
  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-dark text-white flex items-center justify-center font-display font-bold">G</div>
          <div>
            <p className="text-base font-bold text-brand-dark">Verified guest</p>
            <p className="text-sm text-brand-text-muted">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
        </div>
        <Stars value={review.rating} />
      </div>
      {review.comment && <p className="text-base text-brand-text-secondary leading-relaxed">{review.comment}</p>}
    </Card>
  );
}

// Shared reviews block for shortlet, hotel and VIP detail pages.
// `refreshKey` lets a page reload the list after a review is submitted.
export default function ReviewsSection({ listingId, fallback, onWrite, refreshKey = 0, limit = 4 }) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${listingId}|${refreshKey}|${attempt}`;
  const [result, setResult] = useState({ key: null, status: 'loading', items: [], summary: null });

  useEffect(() => {
    if (!listingId) return undefined;
    let active = true;
    getListingReviews(listingId)
      .then((r) => active && setResult({ key: requestKey, status: 'ready', ...r }))
      .catch((e) => {
        if (!active) return;
        // A listing with no review record answers 404: treat as "no reviews yet".
        if (e?.response?.status === 404) setResult({ key: requestKey, status: 'ready', items: [], summary: { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } });
        else setResult({ key: requestKey, status: 'error', items: [], summary: null });
      });
    return () => { active = false; };
  }, [listingId, requestKey]);

  // A newer request (another listing, a refresh or a retry) shows the skeleton until its answer arrives.
  const state = result.key === requestKey ? result : { ...result, status: 'loading' };

  const count = state.summary?.count || 0;

  return (
    <section className="pb-10 border-b border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Star className="w-7 h-7 fill-brand-star text-brand-star" />
          <h3 className="text-2xl md:text-3xl font-display font-bold text-brand-dark tracking-tight">
            {state.status === 'ready' && count > 0
              ? `${state.summary.average.toFixed(1)} · ${count} review${count !== 1 ? 's' : ''}`
              : fallback?.count > 0
                ? `${Number(fallback.rating || 0).toFixed(1)} · ${fallback.count} review${fallback.count !== 1 ? 's' : ''}`
                : 'Guest reviews'}
          </h3>
        </div>
        {onWrite && <Button variant="outline" size="sm" onClick={onWrite}>Write a review</Button>}
      </div>

      {state.status === 'loading' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Skeleton className="h-40" /><Skeleton className="h-40" />
        </div>
      )}

      {state.status === 'error' && (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
          <p className="text-base text-brand-text-secondary">We could not load the reviews.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      )}

      {state.status === 'ready' && count === 0 && (
        <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100 flex flex-col items-center text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mb-4" />
          <h4 className="text-xl font-display font-bold text-brand-dark mb-1">No reviews yet</h4>
          <p className="text-base text-brand-text-secondary max-w-sm">Reviews from guests who completed a stay will appear here.</p>
        </div>
      )}

      {state.status === 'ready' && count > 0 && (
        <div className="space-y-6">
          <ReviewSummary summary={state.summary} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {state.items.slice(0, limit).map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
          {state.items.length > limit && (
            <Button to={`/reviews/${listingId}`} variant="outline">
              See all {count} reviews <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Container, Button, EmptyState, Skeleton, Card } from '../components/ui';
import { ReviewCard, ReviewSummary } from '../components/detail/ReviewsSection';
import { getListingReviews } from '../api/reviews';
import { useDocumentMeta } from '../lib/seo';

export default function Reviews() {
  const { id } = useParams();
  const navigate = useNavigate();
  useDocumentMeta('Guest reviews', 'What guests say about this listing on Rentals Africa.');

  const [state, setState] = useState({ status: 'loading', items: [], summary: null });
  const [filter, setFilter] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    let active = true;
    setState((s) => ({ ...s, status: 'loading' }));
    getListingReviews(id)
      .then((r) => active && setState({ status: 'ready', ...r }))
      .catch((e) => {
        if (!active) return;
        if (e?.response?.status === 404) {
          setState({ status: 'ready', items: [], summary: { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } });
        } else {
          setState({ status: 'error', items: [], summary: null });
        }
      });
    return () => { active = false; };
  }, [id, attempt]);

  const visible = filter ? state.items.filter((r) => Math.round(r.rating) === filter) : state.items;

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <Container className="pt-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-base font-semibold text-brand-text-secondary hover:text-brand-dark mb-6 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to listing
        </button>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-brand-dark tracking-tight mb-8">Guest reviews</h1>

        {state.status === 'loading' && (
          <div className="space-y-5">
            <Skeleton className="h-48" />
            <div className="grid md:grid-cols-2 gap-5"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
          </div>
        )}

        {state.status === 'error' && (
          <Card>
            <EmptyState
              icon={MessageSquare}
              title="We could not load the reviews"
              text="Check your connection and try again."
              action={<Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
            />
          </Card>
        )}

        {state.status === 'ready' && state.summary.count === 0 && (
          <Card>
            <EmptyState icon={MessageSquare} title="No reviews yet" text="Reviews from guests who completed a stay will appear here." />
          </Card>
        )}

        {state.status === 'ready' && state.summary.count > 0 && (
          <div className="space-y-8">
            <ReviewSummary summary={state.summary} />

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by rating">
              {[0, 5, 4, 3, 2, 1].map((n) => (
                <button
                  key={n}
                  role="tab"
                  aria-selected={filter === n}
                  onClick={() => setFilter(n)}
                  className={`px-5 py-2.5 rounded-full text-base font-semibold transition-colors ${
                    filter === n ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-brand-text-secondary hover:border-brand-dark'
                  }`}
                >
                  {n === 0 ? `All (${state.summary.count})` : `${n} star${n > 1 ? 's' : ''} (${state.summary.distribution[n]})`}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <Card><EmptyState icon={MessageSquare} title="No reviews with that rating" action={<Button variant="outline" onClick={() => setFilter(0)}>Show all</Button>} /></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {visible.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </div>
        )}
      </Container>
    </main>
  );
}

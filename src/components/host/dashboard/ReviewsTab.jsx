import { Loader2, MessageSquare, Star } from 'lucide-react';
import { Button, Card, EmptyState, SectionTitle } from '../../ui';

export default function ReviewsTab({ reviews, status, onRetry }) {
  return (
    <div>
      <SectionTitle title="Reviews" subtitle="What guests say about your listings." />
      {status === 'loading' ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
      ) : status === 'error' ? (
        <Card><EmptyState icon={MessageSquare} title="Reviews unavailable" text="We could not load your reviews right now." action={<Button variant="dark" onClick={onRetry}>Try again</Button>} /></Card>
      ) : reviews.length === 0 ? (
        <Card><EmptyState icon={Star} title="No reviews yet" text="Reviews from guests appear here after their stay." /></Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((r) => (
            <Card key={r.id} className="p-6">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h4 className="text-lg font-display font-bold text-brand-dark">{r.listing}</h4>
                <span className="flex items-center gap-1 text-base font-bold text-brand-dark">
                  <Star className="w-5 h-5 fill-brand-star text-brand-star" /> {r.rating.toFixed(1)}
                </span>
              </div>
              {r.comment && <p className="text-base text-brand-text-secondary leading-relaxed">{r.comment}</p>}
              <p className="text-sm text-brand-text-muted mt-3">
                Verified guest{r.createdAt ? ` · ${r.createdAt.toLocaleDateString()}` : ''}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

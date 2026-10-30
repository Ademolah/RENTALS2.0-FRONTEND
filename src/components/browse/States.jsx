import { SearchX, WifiOff } from 'lucide-react';
import { Skeleton, Button } from '../ui';

export function CardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <Skeleton className="h-5 w-3/4 mt-4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
      <Skeleton className="h-5 w-1/3 mt-3" />
    </div>
  );
}

export function SkeletonGrid({ count = 8, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10 ${className}`}>
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function ErrorState({ onRetry, message = "We couldn't load listings. Check your connection and try again." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5">
        <WifiOff className="w-7 h-7 text-brand-text-muted" />
      </div>
      <h3 className="text-xl font-display font-bold text-brand-dark">Something went wrong</h3>
      <p className="text-base text-brand-text-secondary mt-2 mb-6 max-w-sm">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function NoResults({ onClear, hasFilters, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5">
        <SearchX className="w-7 h-7 text-brand-text-muted" />
      </div>
      <h3 className="text-xl font-display font-bold text-brand-dark">No matches found</h3>
      <p className="text-base text-brand-text-secondary mt-2 mb-6 max-w-sm">
        {text || 'Try widening your price range or removing a filter.'}
      </p>
      {hasFilters && onClear && <Button variant="outline" onClick={onClear}>Clear all filters</Button>}
    </div>
  );
}

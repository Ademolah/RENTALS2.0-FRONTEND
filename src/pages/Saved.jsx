import { useCallback, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { AccountShell, ErrorBox } from '../components/account/AccountShell';
import PropertyCard from '../components/PropertyCard';
import { Card, EmptyState, Button, Skeleton } from '../components/ui';
import { getMyFavoritesApi, toggleFavoriteApi } from '../api/user';
import { useDocumentMeta } from '../lib/seo';

const idOf = (p) => p._id || p.id;

const toCard = (p) => ({
  id: idOf(p),
  title: p.title,
  location: [p.address?.city, p.address?.state].filter(Boolean).join(', ') || 'Nigeria',
  price: Number(p.pricePerNight || p.price || 0),
  rating: p.rating || 0,
  numReviews: p.numReviews || 0,
  images: p.images,
  image: p.images?.[0],
  isRentalVerified: p.isVerified ?? true,
});

export default function Saved() {
  useDocumentMeta('Saved stays', 'The stays you have saved on Rentals Africa.');
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(() => {
    setError(false);
    setItems(null);
    if (!localStorage.getItem('rentals_token')) return setItems([]);
    getMyFavoritesApi()
      .then((r) => setItems(r?.data?.favorites || r?.favorites || []))
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  const unsave = async (p) => {
    setRemoving(idOf(p));
    try {
      await toggleFavoriteApi(idOf(p));
      setItems((prev) => prev.filter((x) => idOf(x) !== idOf(p)));
    } catch {
      setError(true);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <AccountShell title="Saved stays" subtitle="Your shortlist, ready when you are.">
      {error ? (
        <ErrorBox message="We could not update your saved stays." onRetry={load} />
      ) : items === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/3]" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Heart}
            title="No saved stays yet"
            text="Tap the heart on any listing to keep it here for later."
            action={<Button to="/">Explore stays</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
          {items.map((p) => (
            <div key={idOf(p)}>
              <PropertyCard property={toCard(p)} />
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={removing === idOf(p)}
                onClick={() => unsave(p)}
              >
                <Heart className="w-4 h-4 fill-brand-primary text-brand-primary" /> Remove from saved
              </Button>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}

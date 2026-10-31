import { Building, Loader2 } from 'lucide-react';
import { Button, Card, EmptyState, SectionTitle } from '../../ui';
import ListingCard from './ListingCard';
import { listingStats } from './bookingMath';
import { NAV_ITEMS, listingsForTab } from './constants';

export default function ListingsTab({ tab, listings, state, bookings, togglingId, onReload, onEdit, onEditRooms, onToggle }) {
  const visible = listingsForTab(listings, tab);
  return (
    <div>
      <SectionTitle title={NAV_ITEMS.find((n) => n.id === tab)?.label} subtitle="Manage details, pricing and availability." />
      {state === 'loading' ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
      ) : state === 'error' ? (
        <Card><EmptyState icon={Building} title="Listings unavailable" text="We could not load your listings right now." action={<Button variant="dark" onClick={onReload}>Try again</Button>} /></Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={Building} title="Nothing here yet" text="Use Add Asset to create your first listing. New listings wait for Rentals Africa approval before guests can see them." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {visible.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              stats={listingStats(bookings, l.id)}
              toggling={togglingId === l.id}
              onEdit={onEdit}
              onEditRooms={onEditRooms}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

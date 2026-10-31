import { Badge, Button, Card, SectionTitle } from '../../ui';
import ActionLabel from './ActionLabel';
import { guestDone, refOf } from './bookingMath';

export default function ArrivingToday({ bookings, processingId, onConfirm }) {
  if (bookings.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <SectionTitle title="Arriving today" subtitle="Confirm check-in or handover as guests arrive." className="!mb-0" />
        <Badge tone="brand">{bookings.length} to confirm</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {bookings.map((b) => (
          <Card key={b._id} className="p-5 flex items-center gap-4">
            <img src={b.asset.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-brand-dark truncate">Booking #{refOf(b)}</p>
              <p className="text-base text-brand-text-secondary truncate">{b.asset.title}</p>
              {guestDone(b) && <Badge tone="green" className="mt-1">Renter confirmed</Badge>}
            </div>
            <Button variant="dark" size="sm" disabled={processingId === b._id} onClick={() => onConfirm(b)}>
              <ActionLabel type={b.type} processing={processingId === b._id} />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

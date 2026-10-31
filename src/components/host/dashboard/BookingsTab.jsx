import { Receipt } from 'lucide-react';
import { Badge, Button, Card, EmptyState, SectionTitle } from '../../ui';
import { canCancelBooking, refOf } from './bookingMath';
import { typeLabel } from './constants';

function StatusBadge({ booking }) {
  if (booking.dead) return <Badge tone="gray">Cancelled</Badge>;
  if (booking.escrowStatus === 'RELEASED') return <Badge tone="green">Funds released</Badge>;
  return <Badge tone="amber">{String(booking.reservationStatus || 'Pending').replace(/_/g, ' ')}</Badge>;
}

export default function BookingsTab({ bookings, today, onCancel }) {
  return (
    <div>
      <SectionTitle title="Bookings" subtitle="Every reservation on your listings. Guest details are handled by Rentals Africa." />
      {bookings.length === 0 ? (
        <Card><EmptyState icon={Receipt} title="No bookings yet" text="Reservations on your listings will appear here." /></Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-gray-100 text-sm uppercase tracking-wider text-brand-text-muted">
                <th className="px-5 py-4 font-bold">Booking</th>
                <th className="px-5 py-4 font-bold">Listing</th>
                <th className="px-5 py-4 font-bold">Dates</th>
                <th className="px-5 py-4 font-bold text-right">Amount</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <div className="font-bold text-brand-dark">#{refOf(b)}</div>
                    <div className="text-sm text-brand-text-secondary">Managed by Rentals Africa</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-brand-dark">{b.asset.title}</div>
                    <div className="text-sm text-brand-text-secondary">{typeLabel(b.type)}</div>
                  </td>
                  <td className="px-5 py-4 text-brand-text-secondary whitespace-nowrap">{b.dates}</td>
                  <td className="px-5 py-4 text-right font-display font-bold text-brand-dark whitespace-nowrap">₦{(b.payoutAmount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4"><StatusBadge booking={b} /></td>
                  <td className="px-5 py-4 text-right">
                    {canCancelBooking(b, today) ? <Button variant="outline" size="sm" onClick={() => onCancel(b)}>Cancel</Button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

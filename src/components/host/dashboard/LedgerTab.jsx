import { CheckCircle, Clock, MapPin, ShieldCheck, Ban } from 'lucide-react';
import { Badge, Button, Card, EmptyState, SectionTitle } from '../../ui';
import ActionLabel from './ActionLabel';
import { canCancelBooking, refOf } from './bookingMath';
import { typeLabel } from './constants';

function LedgerCard({ booking, today, processingId, onConfirm, onCancel }) {
  const isCar = booking.type === 'CAR';
  const isVip = booking.type === 'VIP';
  const isVipService = booking.type === 'VIP_SERVICE';
  const isReleased = booking.escrowStatus === 'RELEASED';
  const hasHostConfirmed = isCar ? booking.ownerConfirmedHandover : booking.checkInConfirmedByHost;
  const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
  const confirming = processingId === booking._id;

  return (
    <Card className="p-5 flex flex-col md:flex-row gap-6 overflow-hidden hover:shadow-card-hover transition-shadow">
      <div className="w-full md:w-60 h-48 md:h-auto relative overflow-hidden bg-gray-100 shrink-0 rounded-xl">
        <img src={booking.asset.image} alt={booking.asset.title} className="w-full h-full object-cover" />
        <Badge tone={(isVip || isVipService) ? 'amber' : 'dark'} className="absolute top-3 left-3">{typeLabel(booking.type)}</Badge>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          <div>
            <h3 className="text-xl font-display font-bold text-brand-dark mb-2 leading-tight">{booking.asset.title}</h3>
            <div className="flex items-center text-brand-text-secondary text-base">
              <MapPin className="w-4 h-4 mr-1.5 text-brand-text-muted shrink-0" /> <span className="truncate">{booking.asset.location}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <div className="flex justify-between items-center gap-3">
              <span className="text-sm font-semibold text-brand-text-muted">Booking</span>
              <div className="text-right">
                <div className="text-base font-bold text-brand-dark">#{refOf(booking)}</div>
                <div className="text-sm text-brand-text-secondary">Managed by Rentals Africa</div>
              </div>
            </div>
            <div className="flex justify-between items-center gap-3 pt-3 border-t border-gray-200">
              <span className="text-sm font-semibold text-brand-text-muted">Dates</span>
              <span className="text-base font-bold text-brand-dark text-right">{booking.dates}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-gray-100 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="text-sm font-semibold text-brand-text-muted">Payout amount</div>
              <div className="text-2xl font-display font-bold text-brand-dark tracking-tight">₦{booking.payoutAmount.toLocaleString()}</div>
            </div>

            {isReleased ? (
              <Badge tone="green"><CheckCircle className="w-4 h-4" /> Funds Released</Badge>
            ) : hasHostConfirmed && !hasGuestConfirmed ? (
              <Badge tone="amber"><Clock className="w-4 h-4" /> Awaiting Client</Badge>
            ) : hasGuestConfirmed && !hasHostConfirmed ? (
              <Badge tone="brand"><ShieldCheck className="w-4 h-4" /> Client Confirmed</Badge>
            ) : null}
          </div>

          {canCancelBooking(booking, today) && (
            <Button variant="outline" onClick={() => onCancel(booking)} className="w-full sm:w-auto"><Ban className="w-4 h-4" /> Cancel reservation</Button>
          )}
          {!isReleased && (!hasHostConfirmed || (hasGuestConfirmed && !hasHostConfirmed)) && (
            <Button
              variant={hasGuestConfirmed ? 'primary' : 'dark'}
              onClick={() => onConfirm(booking)}
              disabled={confirming}
              className="w-full sm:w-auto"
            >
              <ActionLabel type={booking.type} processing={confirming} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function LedgerTab({ bookings, today, processingId, onConfirm, onCancel }) {
  if (bookings.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ShieldCheck}
          title="No active ledger entries"
          text="Your portfolio is currently empty. List a new property, vehicle, or VIP service to begin accepting reservations."
        />
      </Card>
    );
  }
  return (
    <div className="space-y-5">
      <SectionTitle title="Ledger & Actions" subtitle="Confirm arrivals to release your payout." />
      {bookings.map((booking) => (
        <LedgerCard key={booking._id} booking={booking} today={today} processingId={processingId} onConfirm={onConfirm} onCancel={onCancel} />
      ))}
    </div>
  );
}

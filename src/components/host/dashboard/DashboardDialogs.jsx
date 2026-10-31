import { useState } from 'react';
import { Button, ConfirmDialog } from '../../ui';
import { actionLabel } from './constants';
import { hostDone, refOf } from './bookingMath';

// Host types a guest's booking code (for example #A1B2C3) to confirm their arrival.
function BookingCodeDialog({ bookings, onClose, onMatch, notify }) {
  const [code, setCode] = useState('');

  const find = () => {
    const wanted = code.replace('#', '').trim().toUpperCase();
    const match = bookings.find((b) => refOf(b) === wanted);
    if (!match) return notify('No booking found with that code.');
    if (match.dead || !match.paid) return notify('That booking is not active.');
    if (match.escrowStatus === 'RELEASED' || hostDone(match)) return notify('You have already confirmed this booking.', 'success');
    onClose();
    onMatch(match);
    return undefined;
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-elevated p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display font-bold text-brand-dark">Enter booking code</h2>
        <p className="mt-2 text-base text-brand-text-secondary">Ask the guest for the code on their booking (for example #A1B2C3) to confirm their arrival.</p>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && find()}
          placeholder="#A1B2C3"
          className="mt-5 w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-brand-dark outline-none text-xl font-display font-bold tracking-widest uppercase" aria-label="#A1B2C3" />
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="dark" onClick={find} disabled={!code.trim()}>Find booking</Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardDialogs({
  bookings, notify,
  cancelTarget, cancelling, onConfirmCancel, onDismissCancel,
  codeOpen, onCloseCode, codeMatch, onCodeMatch, onClearCodeMatch,
  processingId, onConfirmBooking,
}) {
  return (
    <>
      <ConfirmDialog
        open={!!cancelTarget}
        danger
        busy={cancelling}
        title="Cancel this reservation?"
        text={cancelTarget ? `Booking #${refOf(cancelTarget)} will be cancelled and the dates freed. The guest's payment goes to Rentals Africa for review and refund. This cannot be undone.` : ''}
        confirmLabel="Cancel reservation"
        onConfirm={onConfirmCancel}
        onCancel={onDismissCancel}
      />

      <ConfirmDialog
        open={!!codeMatch}
        busy={processingId === codeMatch?._id}
        title={codeMatch ? `Confirm ${actionLabel(codeMatch.type).toLowerCase().replace('confirm ', '')}?` : ''}
        text={codeMatch ? `Booking #${refOf(codeMatch)} at ${codeMatch.asset.title}.` : ''}
        confirmLabel="Confirm"
        onConfirm={async () => { await onConfirmBooking(codeMatch); onClearCodeMatch(); }}
        onCancel={onClearCodeMatch}
      />

      {codeOpen && <BookingCodeDialog bookings={bookings} onClose={onCloseCode} onMatch={onCodeMatch} notify={notify} />}
    </>
  );
}


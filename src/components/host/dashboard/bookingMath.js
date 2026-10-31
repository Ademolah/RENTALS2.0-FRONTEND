// Pure helpers for the host ledger. Hosts receive 95% of each booking (5% platform commission).
export const refOf = (b) => String(b._id).slice(-6).toUpperCase();
export const net = (n) => Math.round((Number(n) || 0) * 0.95);

export const hostDone = (b) => (b.type === 'CAR' ? b.ownerConfirmedHandover : b.checkInConfirmedByHost);
export const guestDone = (b) => (b.type === 'CAR' ? b.guestConfirmedPickup : b.checkInConfirmedByGuest);

export function summarizeBookings(bookings, today) {
  const totalClearedEarnings = bookings.reduce((sum, b) => (!b.dead && b.escrowStatus === 'RELEASED' ? sum + net(b.payoutAmount) : sum), 0);
  const pendingPayout = bookings.reduce((sum, b) => (b.paid && !b.dead && b.escrowStatus !== 'RELEASED' ? sum + net(b.payoutAmount) : sum), 0);
  const arrivingToday = bookings.filter((b) => b.paid && !b.dead && b.escrowStatus !== 'RELEASED' && !hostDone(b) && b.startDay && b.startDay <= today && b.endDay >= today);
  const payoutRows = bookings.filter((b) => b.paid && !b.dead);
  return { totalClearedEarnings, pendingPayout, arrivingToday, payoutRows };
}

export const canCancelBooking = (b, today) => (
  b.paid && !b.dead && b.escrowStatus !== 'RELEASED' && !hostDone(b) && !guestDone(b) && b.startDay && b.startDay > today
);

export function listingStats(bookings, listingId) {
  const mine = bookings.filter((b) => b.assetId === listingId && b.paid && !b.dead);
  return {
    count: mine.length,
    earned: mine.reduce((sum, b) => (b.escrowStatus === 'RELEASED' ? sum + net(b.payoutAmount) : sum), 0),
  };
}

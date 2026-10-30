import { apiClient } from './client';
import { getMyPropertyBookings, cancelBookingApi } from './reservation';
import { getMyCarBookings, confirmCarHandover } from './car';
import { getMyHotelBookings, confirmHotelGuestCheckIn } from './hotel';
import { confirmPropertyCheckIn } from './properties';
import { executePayout } from './payouts';

export { cancelBookingApi };

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

const trueType = (b) => {
  const cat = b.propertyId?.category;
  if (b.type === 'CAR' || b.carId) return 'CAR';
  if (b.type === 'HOTEL' || cat === 'HOTEL') return 'HOTEL';
  if (cat === 'VIP_SERVICE') return 'VIP_SERVICE';
  if (cat === 'VIP RESERVATION' || cat === 'VIP' || b.type === 'VIP') return 'VIP';
  return 'SHORTLET';
};

export const TYPE_LABEL = {
  SHORTLET: 'Shortlet',
  HOTEL: 'Hotel',
  CAR: 'Car rental',
  VIP: 'VIP venue',
  VIP_SERVICE: 'VIP service',
};

export function normaliseBooking(b, forcedType) {
  const type = forcedType || trueType(b);
  const isCar = type === 'CAR';
  const asset = isCar ? b.carId : b.propertyId;

  const title = isCar
    ? [asset?.make, asset?.carModel, asset?.year].filter(Boolean).join(' ') || 'Car rental'
    : asset?.title || TYPE_LABEL[type];
  const location = isCar
    ? [asset?.location?.city, asset?.location?.state].filter(Boolean).join(', ')
    : [asset?.address?.city, asset?.address?.state].filter(Boolean).join(', ');

  const start = new Date(b.startDate || b.pickupTime || b.checkInDate || b.date || b.createdAt);
  const endRaw = b.endDate || b.dropoffTime || b.checkOutDate;
  const end = endRaw ? new Date(endRaw) : null;

  const guestConfirmed = isCar ? !!b.guestConfirmedPickup : !!(b.checkInConfirmedByGuest || b.guestConfirmedDelivery);
  const hostConfirmed = isCar
    ? !!b.ownerConfirmedHandover
    : !!(b.checkInConfirmedByHost || b.checkInConfirmedByLandlord || b.ownerConfirmedDelivery);
  const payout = isCar ? b.escrowStatus : b.payoutStatus;
  const released = isCar ? payout === 'RELEASED' : payout === 'RELEASED_TO_LANDLORD';

  const cancelled = b.reservationStatus === 'CANCELLED' || b.status === 'CANCELLED';
  const completed = b.reservationStatus === 'COMPLETED' || released;
  const pastDate = (end || start).getTime() < Date.now() - 24 * 3600 * 1000;
  const bucket = cancelled ? 'cancelled' : completed || pastDate ? 'past' : 'upcoming';

  const id = String(b._id || b.id);
  return {
    id,
    raw: b,
    type,
    typeLabel: TYPE_LABEL[type],
    title,
    location: location || 'Lagos / Abuja',
    image: asset?.images?.[0] || PLACEHOLDER,
    listingId: asset?._id || (typeof b.propertyId === 'string' ? b.propertyId : undefined),
    start,
    end,
    total: Number(b.totalAmount || b.totalPrice || 0),
    reference: `#${(b.reference || b.bookingReference || id.slice(-6)).toString().toUpperCase()}`,
    paid: b.paymentStatus ? b.paymentStatus === 'SUCCESS' : true,
    guestConfirmed,
    hostConfirmed,
    released,
    cancelled,
    completed,
    bucket,
    canCancel: !guestConfirmed && !released && !cancelled && !completed && start.getTime() > Date.now(),
    createdAt: new Date(b.createdAt || start).getTime(),
  };
}

const list = (r) => r?.data?.bookings || [];

export async function fetchGuestBookings() {
  const [stays, cars, hotels] = await Promise.allSettled([
    getMyPropertyBookings(),
    getMyCarBookings(),
    getMyHotelBookings(),
  ]);
  if (stays.status === 'rejected' && cars.status === 'rejected' && hotels.status === 'rejected') {
    throw stays.reason;
  }
  const rows = [
    ...(stays.status === 'fulfilled' ? list(stays.value).map((b) => normaliseBooking(b)) : []),
    ...(cars.status === 'fulfilled' ? list(cars.value).map((b) => normaliseBooking(b, 'CAR')) : []),
    ...(hotels.status === 'fulfilled' ? list(hotels.value).map((b) => normaliseBooking(b, 'HOTEL')) : []),
  ];
  const byId = new Map();
  rows.forEach((r) => byId.set(r.id, r));
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getArrivalGuide(id) {
  try {
    const res = await apiClient.get(`/reservations/${id}/arrival-guide`);
    const d = res.data?.data || {};
    const notes = typeof d.notes === 'string' ? d.notes.trim() : '';
    const photos = Array.isArray(d.photos) ? d.photos.filter((u) => typeof u === 'string' && /^https:\/\//.test(u)) : [];
    return notes || photos.length ? { notes, photos } : null;
  } catch (e) {
    if (e?.response?.status === 403 || e?.response?.status === 404) return null;
    throw e;
  }
}

export async function confirmArrival(booking) {
  if (booking.type === 'CAR') await confirmCarHandover(booking.id);
  else if (booking.type === 'HOTEL') await confirmHotelGuestCheckIn(booking.id);
  else await confirmPropertyCheckIn(booking.id);
  if (booking.hostConfirmed) {
    await executePayout(booking.id);
    return { released: true };
  }
  return { released: false };
}

export async function submitReview(listingId, rating, comment) {
  const res = await apiClient.post(`/reviews/${listingId}`, { rating, comment });
  return res.data;
}

export const errorText = (e, fallback) => e?.response?.data?.message || fallback;

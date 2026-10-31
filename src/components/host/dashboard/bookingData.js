import { getLandlordPropertyBookings } from '../../../api/properties';
import { getLandlordCarBookings } from '../../../api/car';
import { getLandlordHotelBookings } from '../../../api/hotel';
import { dayOf } from '../hostApi';

const PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
const HOTEL_IMAGE = 'https://images.unsplash.com/photo-1551882547-ff40eb0d1556?auto=format&fit=crop&w=800&q=80';
const CAR_IMAGE = 'https://images.unsplash.com/photo-1503376760302-83f0453a4574?auto=format&fit=crop&w=800&q=80';

const flagsOf = (b) => ({
  paid: String(b.paymentStatus || '').toUpperCase() === 'SUCCESS',
  dead: /CANCEL|FAIL|REFUND|EXPIRE/.test(`${b.reservationStatus || ''} ${b.paymentStatus || ''}`.toUpperCase()),
});

const normalizeLocation = (addr) => (
  addr
    ? (typeof addr === 'object'
      ? `${addr.city || ''}, ${addr.state || ''}`.replace(/(^,\s*)|(,\s*$)/g, '')
      : addr)
    : 'Location hidden'
);

const dateRange = (from, to) => `${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`;

// Property bookings also cover VIP venues and VIP services.
function normalizePropertyBooking(b) {
  let type = 'SHORTLET';
  const category = b.propertyId?.category;
  if (category === 'VIP_SERVICE') type = 'VIP_SERVICE';
  else if (category === 'VIP RESERVATION' || category === 'VIP') type = 'VIP';
  else if (category === 'HOTEL') type = 'HOTEL';

  // Services use start/end dates, venues use check-in/check-out.
  const dates = b.startDate && b.endDate ? dateRange(b.startDate, b.endDate) : dateRange(b.checkInDate, b.checkOutDate);

  return {
    _id: b._id,
    assetId: b.propertyId?._id,
    ...flagsOf(b),
    startDay: dayOf(b.startDate || b.checkInDate),
    endDay: dayOf(b.endDate || b.checkOutDate),
    type,
    reservationStatus: b.reservationStatus,
    escrowStatus: b.escrowStatus,
    checkInConfirmedByGuest: b.guestConfirmedDelivery || b.checkInConfirmedByGuest,
    checkInConfirmedByHost: b.ownerConfirmedDelivery || b.checkInConfirmedByHost,
    payoutAmount: b.totalAmount,
    dates,
    asset: {
      title: b.propertyId?.title || 'Asset',
      location: normalizeLocation(b.propertyId?.address),
      image: b.propertyId?.images?.[0] || PROPERTY_IMAGE,
    },
    createdAt: new Date(b.createdAt),
  };
}

const normalizeHotelBooking = (b) => ({
  _id: b._id,
  assetId: b.propertyId?._id,
  ...flagsOf(b),
  startDay: dayOf(b.checkInDate),
  endDay: dayOf(b.checkOutDate),
  type: 'HOTEL',
  reservationStatus: b.reservationStatus,
  escrowStatus: b.escrowStatus,
  checkInConfirmedByGuest: b.checkInConfirmedByGuest,
  checkInConfirmedByHost: b.checkInConfirmedByHost,
  payoutAmount: b.totalAmount,
  dates: dateRange(b.checkInDate, b.checkOutDate),
  asset: {
    title: b.propertyId?.title || 'Hotel',
    location: normalizeLocation(b.propertyId?.address),
    image: b.propertyId?.images?.[0] || HOTEL_IMAGE,
  },
  createdAt: new Date(b.createdAt),
});

const normalizeCarBooking = (b) => ({
  _id: b._id,
  assetId: b.carId?._id,
  ...flagsOf(b),
  startDay: dayOf(b.pickupTime),
  endDay: dayOf(b.dropoffTime),
  type: 'CAR',
  reservationStatus: b.reservationStatus,
  escrowStatus: b.escrowStatus,
  guestConfirmedPickup: b.guestConfirmedPickup,
  ownerConfirmedHandover: b.ownerConfirmedHandover,
  payoutAmount: b.totalAmount,
  dates: dateRange(b.pickupTime, b.dropoffTime),
  asset: {
    title: b.carId ? `${b.carId.make} ${b.carId.carModel} ${b.carId.year}` : 'Vehicle',
    location: b.carId?.location
      ? [b.carId.location.address, b.carId.location.city, b.carId.location.state].filter(Boolean).join(', ')
      : 'Platform Pickup',
    image: b.carId?.images?.[0] || CAR_IMAGE,
  },
  createdAt: new Date(b.createdAt),
});

const EMPTY = { data: { bookings: [] } };

// Loads the three booking endpoints and merges them, newest first. A failing endpoint counts as `failedLoads`.
export async function loadHostBookings() {
  let failedLoads = 0;
  const safe = (fn) => fn().catch(() => { failedLoads += 1; return EMPTY; });
  const [propResponse, carResponse, hotelResponse] = await Promise.all([
    safe(getLandlordPropertyBookings),
    safe(getLandlordCarBookings),
    safe(getLandlordHotelBookings),
  ]);

  const combined = [
    ...(propResponse?.data?.bookings || []).map(normalizePropertyBooking),
    ...(hotelResponse?.data?.bookings || []).map(normalizeHotelBooking),
    ...(carResponse?.data?.bookings || []).map(normalizeCarBooking),
  ];
  const unique = Array.from(new Map(combined.map((item) => [item._id, item])).values());
  return { bookings: unique.sort((a, b) => b.createdAt - a.createdAt), failedLoads };
}

export function normalizeAnalytics(res) {
  const d = res?.data || {};
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const sm = d.summary || {};
  const rows = Array.isArray(d.chartData) ? d.chartData : [];
  return {
    year: num(d.year) || new Date().getFullYear(),
    summary: {
      totalEarnings: num(sm.totalEarnings),
      pendingPayouts: num(sm.pendingPayouts),
      completedPayouts: num(sm.completedPayouts),
      totalBookings: num(sm.totalBookings),
    },
    months: Array.from({ length: 12 }, (_, i) => {
      const m = rows.find((r) => num(r.month) === i + 1) || {};
      return { month: i + 1, totalEarnings: num(m.totalEarnings), bookings: num(m.bookings) };
    }),
  };
}

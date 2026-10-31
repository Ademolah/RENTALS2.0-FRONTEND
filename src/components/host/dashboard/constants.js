import { Building, Car, Hotel, Crown, ShieldCheck, Receipt, Banknote, BarChart3, MessageSquare } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'ACTION_FEED', label: 'Ledger & Actions', icon: ShieldCheck },
  { id: 'BOOKINGS', label: 'Bookings', icon: Receipt },
  { id: 'PAYOUTS', label: 'Payouts', icon: Banknote },
  { id: 'EARNINGS', label: 'Earnings', icon: BarChart3 },
  { id: 'REVIEWS', label: 'Reviews', icon: MessageSquare },
  { id: 'SHORTLETS', label: 'My Shortlets', icon: Building },
  { id: 'HOTELS', label: 'My Hotels', icon: Hotel },
  { id: 'CARS', label: 'My Cars', icon: Car },
  { id: 'VIP ASSETS', label: 'VIP Assets', icon: Crown },
];

export const LISTING_TABS = ['SHORTLETS', 'CARS', 'HOTELS', 'VIP ASSETS'];

export const STATUS_BADGE = {
  active: { tone: 'green', label: 'Approved' },
  paused: { tone: 'gray', label: 'Approved, unavailable' },
  pending: { tone: 'amber', label: 'Waiting for admin approval' },
  rejected: { tone: 'brand', label: 'Not approved' },
};

export const ASSET_MENU = [
  { key: 'PROPERTY', label: 'Property', sub: 'Apartment • Shortlet', icon: Building, color: 'text-brand-primary bg-brand-primary-soft' },
  { key: 'CAR', label: 'Vehicle', sub: 'Rental • Chauffeur', icon: Car, color: 'text-brand-purple bg-brand-purple-soft' },
  { key: 'HOTEL', label: 'Hotel', sub: 'Boutique • Resort', icon: Hotel, color: 'text-blue-600 bg-blue-50' },
  { key: 'VIP', label: 'VIP Asset', sub: 'Venue • Service • Security', icon: Crown, color: 'text-amber-600 bg-amber-50' },
];

export const typeLabel = (t) =>
  t === 'CAR' ? 'Vehicle' : t === 'HOTEL' ? 'Hotel Room' : t === 'VIP_SERVICE' ? 'VIP Service' : t === 'VIP' ? 'VIP Reservation' : 'Property';

export const actionLabel = (type) => {
  if (type === 'SHORTLET') return 'Confirm Checkin';
  if (type === 'CAR') return 'Confirm Pickup';
  if (type === 'HOTEL') return 'Guest Checked In';
  if (type === 'VIP') return 'Confirm Arrival';
  if (type === 'VIP_SERVICE') return 'Confirm Service Delivery';
  return 'Confirm';
};

export const viewAsGuestPath = (l) => (
  l.type === 'CAR' ? `/cars/${l.id}`
    : l.type === 'HOTEL' ? `/hotel/${l.id}`
      : l.type === 'VIP' ? `/vip/${l.id}`
        : l.type === 'VIP_SERVICE' ? `/vip/services/${l.id}`
          : `/property/${l.id}`
);

export const tabForListing = (l) => (
  l.type === 'CAR' ? 'CARS' : l.type === 'HOTEL' ? 'HOTELS' : l.type === 'SHORTLET' ? 'SHORTLETS' : 'VIP ASSETS'
);

export const listingsForTab = (listings, tab) => listings.filter((l) => {
  if (tab === 'SHORTLETS') return l.type === 'SHORTLET';
  if (tab === 'HOTELS') return l.type === 'HOTEL';
  if (tab === 'CARS') return l.type === 'CAR';
  if (tab === 'VIP ASSETS') return l.type === 'VIP' || l.type === 'VIP_SERVICE';
  return false;
});

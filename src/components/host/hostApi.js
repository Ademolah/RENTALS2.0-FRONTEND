import { apiClient } from '../../api/client';

const str = (v) => (v == null ? '' : String(v));
const arr = (v) => (Array.isArray(v) ? v : []);

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

export function listingStatus(raw) {
  const s = `${str(raw.status)} ${str(raw.approvalStatus)} ${str(raw.listingStatus)}`.toUpperCase();
  if (s.includes('PENDING')) return 'pending';
  if (s.includes('REJECT')) return 'rejected';
  return raw.isAvailable === false ? 'paused' : 'active';
}

const place = (a) => {
  if (!a) return 'Lagos / Abuja';
  if (typeof a === 'string') return a;
  return [a.address || a.street, a.city, a.state].filter(Boolean).join(', ') || 'Lagos / Abuja';
};

function normalize(raw, type) {
  const price =
    type === 'CAR' ? raw.pricePer12Hours
    : type === 'HOTEL' ? (raw.startingPrice ?? raw.pricePerNight)
    : type === 'VIP' ? (raw.depositAmount ?? raw.pricePerNight)
    : type === 'VIP_SERVICE' ? (raw.pricePerDay ?? raw.pricePerNight)
    : raw.pricePerNight;
  return {
    id: raw._id || raw.id,
    type,
    raw,
    title: type === 'CAR' ? `${str(raw.make)} ${str(raw.carModel)} ${str(raw.year)}`.trim() || 'Vehicle' : raw.title || 'Listing',
    location: place(type === 'CAR' ? (raw.location || raw.address) : raw.address),
    image: arr(raw.images)[0] || FALLBACK_IMAGE,
    price: Number(price) || 0,
    status: listingStatus(raw),
  };
}

// Shape of every list response: { status, data: { <key>: [...] } }
const pick = (res, key) => arr(res?.data?.[key] ?? res?.[key]);

export async function fetchMyListings(userId) {
  let failed = 0;
  const get = (url, key) =>
    apiClient.get(url).then((r) => pick(r.data, key)).catch(() => { failed += 1; return []; });

  const [hotels, cars, vip, props] = await Promise.all([
    get('/hotels/landlord/portfolio', 'hotels'),
    get('/cars/landlord/fleet', 'cars'),
    get('/vip/landlord', 'establishments'),
    userId ? get(`/properties?ownerId=${userId}&limit=50`, 'properties') : Promise.resolve([]),
  ]);

  const all = [
    ...props.filter((p) => !['HOTEL', 'VIP', 'VIP RESERVATION', 'VIP_SERVICE'].includes(str(p.category).toUpperCase())).map((p) => normalize(p, 'SHORTLET')),
    ...hotels.map((h) => normalize(h, 'HOTEL')),
    ...cars.map((c) => normalize(c, 'CAR')),
    ...vip.map((v) => normalize(v, str(v.category).toUpperCase() === 'VIP_SERVICE' ? 'VIP_SERVICE' : 'VIP')),
  ];
  const seen = new Set();
  const items = all.filter((l) => l.id && !seen.has(l.id) && seen.add(l.id));
  return { items, failed };
}

// Pause / resume = multipart PATCH (PUT for VIP venues) with isAvailable, resending the fields the API requires.
export async function setListingAvailable(listing, available) {
  const r = listing.raw;
  const form = new FormData();
  form.append('isAvailable', String(available));
  form.append('existingImages', JSON.stringify(arr(r.images)));

  if (listing.type === 'CAR') {
    form.append('make', str(r.make));
    form.append('carModel', str(r.carModel));
    form.append('year', str(r.year));
    form.append('description', str(r.description));
    form.append('pricePer12Hours', str(r.pricePer12Hours));
    form.append('seatNumber', str(r.seatNumber ?? 4));
    form.append('features', (Array.isArray(r.features) ? r.features : str(r.features).split(',')).map((f) => str(f).trim()).filter(Boolean).join(', '));
    return apiClient.patch(`/cars/${listing.id}`, form);
  }

  form.append('title', str(r.title));
  form.append('description', str(r.description));

  if (listing.type === 'VIP') {
    const hours = r.openHours || {};
    form.append('establishmentType', str(r.establishmentType || 'OTHER'));
    form.append('depositAmount', str(r.depositAmount));
    form.append('dressCode', str(r.dressCode));
    form.append('street', str(r.address?.street));
    form.append('city', str(r.address?.city));
    form.append('state', str(r.address?.state));
    form.append('open', str(hours.open));
    form.append('close', str(hours.close));
    form.append('daysOpen', JSON.stringify(arr(hours.daysOpen)));
    form.append('services', JSON.stringify(arr(r.services)));
    return apiClient.put(`/vip/${listing.id}`, form);
  }

  if (listing.type === 'HOTEL') {
    form.append('hasBreakfast', String(!!r.hasBreakfast));
    return apiClient.patch(`/hotels/${listing.id}`, form);
  }

  form.append('pricePerNight', str(r.pricePerNight));
  return apiClient.patch(`/properties/${listing.id}`, form);
}

// Reviews for the host's own listings. Reviewer identity is never shown (privacy rule).
export async function fetchHostReviews(listings) {
  const targets = listings.filter((l) => l.type !== 'CAR' && l.type !== 'VIP_SERVICE').slice(0, 15);
  const results = await Promise.all(
    targets.map((l) =>
      apiClient.get(`/reviews/${l.id}`)
        .then((r) => arr(r.data?.reviews ?? r.data?.data?.reviews).map((rv) => ({
          id: rv._id || `${l.id}-${rv.createdAt}`,
          listing: l.title,
          rating: Number(rv.rating) || 0,
          comment: str(rv.comment),
          createdAt: rv.createdAt ? new Date(rv.createdAt) : null,
        })))
        .catch(() => [])
    )
  );
  return results.flat().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

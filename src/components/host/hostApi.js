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

  // Listings the host just submitted may not be returned by the server until an admin approves them,
  // so they are remembered on this device and shown as waiting for approval.
  if (userId) {
    const stillWaiting = readSubmitted(userId).filter((r) => !seen.has(r.id) && Date.now() - r.at < SUBMITTED_TTL_MS);
    if (failed === 0) writeSubmitted(userId, stillWaiting);
    stillWaiting.forEach((r) => items.push({ ...normalize(r.raw, r.type), status: 'pending', local: true }));
  }
  return { items, failed };
}

const SUBMITTED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const submittedKey = (userId) => `rentals_submitted_listings_${userId}`;

function readSubmitted(userId) {
  try {
    const v = JSON.parse(localStorage.getItem(submittedKey(userId)) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeSubmitted(userId, list) {
  try {
    localStorage.setItem(submittedKey(userId), JSON.stringify(list.slice(-50)));
  } catch {
    /* storage unavailable */
  }
}

const KEEP = ['_id', 'id', 'title', 'images', 'address', 'location', 'category', 'pricePerNight', 'startingPrice', 'pricePer12Hours', 'depositAmount', 'pricePerDay', 'make', 'carModel', 'year', 'status'];

export function rememberSubmitted(userId, type, raw) {
  if (!userId || !raw || !(raw._id || raw.id)) return;
  const slim = {};
  KEEP.forEach((k) => { if (raw[k] !== undefined) slim[k] = k === 'images' ? arr(raw.images).slice(0, 2) : raw[k]; });
  const id = String(raw._id || raw.id);
  const list = readSubmitted(userId).filter((r) => r.id !== id);
  list.push({ id, type, raw: slim, at: Date.now() });
  writeSubmitted(userId, list);
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

// Lagos calendar day (YYYY-MM-DD) for "arriving today" checks.
export const lagosToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
export const dayOf = (v) => {
  const t = v ? new Date(v) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }) : '';
};

// Median nightly rate of similar live listings (same kind, same state, similar size).
export async function fetchSuggestedPrice({ category, state, area, bedrooms }) {
  const hotels = category === 'hotels';
  const res = await apiClient.get(hotels ? '/hotels?limit=100' : '/properties?limit=100');
  const list = pick(res.data, hotels ? 'hotels' : 'properties');
  const live = list.filter((l) => {
    const cat = str(l.category).toUpperCase();
    if (!hotels && ['HOTEL', 'VIP', 'VIP RESERVATION', 'VIP_SERVICE'].includes(cat)) return false;
    const price = Number(hotels ? (l.startingPrice ?? l.pricePerNight) : l.pricePerNight);
    return price > 0 && l.isAvailable !== false && str(l.address?.state).toLowerCase() === state.toLowerCase();
  });
  const priceOf = (l) => Number(hotels ? (l.startingPrice ?? l.pricePerNight) : l.pricePerNight);
  const near = (l) => hotels || bedrooms === undefined || Math.abs(Number(l.capacity?.bedrooms ?? l.bedrooms ?? bedrooms) - bedrooms) <= 1;
  const wanted = str(area).trim().toLowerCase();
  const inArea = wanted ? live.filter((l) => near(l) && `${str(l.address?.city)} ${str(l.address?.street)}`.toLowerCase().includes(wanted)) : [];
  const pool = inArea.length >= 2 ? inArea : live.filter(near);
  if (pool.length < 2) return { price: null, count: pool.length, scope: '' };
  const sorted = pool.map(priceOf).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { price: Math.round(median / 1000) * 1000, count: pool.length, scope: inArea.length >= 2 ? area : state };
}

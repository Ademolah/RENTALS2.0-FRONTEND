export const CITIES = ['Lagos', 'Abuja'];

export const MAX_PRICE = 5000000;

export const AMENITY_OPTIONS = ['WiFi', 'Swimming Pool', '24/7 Power', 'Parking', 'Air Conditioning', 'Fitness', 'Chef', 'Security'];

export const CAR_CLASSES = [
  { value: 'LUXURY', label: 'Luxury' },
  { value: 'SUV', label: 'SUV' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'CHAUFFEUR_DRIVEN', label: 'Chauffeur' },
  { value: 'VAN', label: 'Van' },
];

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

const str = (v) => String(v ?? '').toLowerCase();

export function listingTag(item, kind) {
  if (kind === 'hotel') return 'Hotel';
  if (kind === 'car') {
    return str(item.category).includes('chauffeur') ? 'Chauffeur' : 'Car';
  }
  if (kind === 'vip-service') return 'VIP Security';
  if (kind === 'vip') return 'VIP';
  const sub = str(item.propertySubtype || item.subtype || item.propertyType || item.type);
  if (sub.includes('vacation')) return 'Vacation Home';
  if (sub.includes('studio')) return 'Studio';
  return 'Shortlet';
}

export const kindLabel = (kind) => ({ hotel: 'Hotel', car: 'Car', shortlet: 'Shortlet', vip: 'VIP', 'vip-service': 'VIP Security' }[kind] || 'Stay');

export function matchesQuery(item, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const a = item.address || item.location || {};
  const hay = [
    item.title, item.make, item.carModel, item.name, item.description, item.establishmentType, item.serviceType,
    a.street, a.city, a.state,
    ...(Array.isArray(item.amenities) ? item.amenities : []),
  ].map(str).join(' ');
  return q.split(/\s+/).every((word) => hay.includes(word));
}

export const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export function itemCity(item) {
  const a = item.address || item.location || {};
  return `${a.city || ''} ${a.state || ''}`.toLowerCase();
}

export function itemPrice(item) {
  return Number(
    item.startingPrice ?? item.pricePerNight ?? item.pricePer12Hours ?? item.pricePerDay ?? item.price ?? 0
  );
}

function matchesCity(item, city) {
  if (!city) return true;
  const hay = itemCity(item);
  return hay.includes(city.toLowerCase());
}

export function applyFilters(items, f, extra = {}) {
  const amenityList = (item) => (item.amenities || item.features || item.services || []).map(str);
  return items.filter((item) => {
    if (f.city && !matchesCity(item, f.city)) return false;
    const price = itemPrice(item);
    if (f.minPrice && price < f.minPrice) return false;
    if (f.maxPrice && price > f.maxPrice) return false;
    if (f.bedrooms && Number(item.bedrooms || item.capacity?.bedrooms || 0) < f.bedrooms) return false;
    if (f.bathrooms && Number(item.bathrooms || item.capacity?.bathrooms || 0) < f.bathrooms) return false;
    if (f.ptypes?.length && !f.ptypes.includes(listingTag(item, 'shortlet'))) return false;
    if (f.minRating && Number(item.rating || 0) < f.minRating) return false;
    if (f.seats && Number(item.seatNumber || 0) < f.seats) return false;
    if (f.classes?.length && !f.classes.includes(String(item.category || '').toUpperCase())) return false;
    if (f.transmission && str(item.transmission) !== f.transmission) return false;
    if (f.types?.length) {
      const t = String(item.establishmentType || item.serviceType || '').toUpperCase();
      if (!f.types.includes(t)) return false;
    }
    if (f.amenities?.length) {
      const have = amenityList(item);
      if (!f.amenities.every((a) => have.some((h) => h.includes(a.toLowerCase())))) return false;
    }
    if (f.query && !matchesQuery(item, f.query)) return false;
    if (extra.custom && !extra.custom(item, f)) return false;
    return true;
  });
}

export function sortItems(items, sort) {
  const list = [...items];
  if (sort === 'price_asc') return list.sort((a, b) => itemPrice(a) - itemPrice(b));
  if (sort === 'price_desc') return list.sort((a, b) => itemPrice(b) - itemPrice(a));
  if (sort === 'rating') return list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  return list;
}

export function filterChips(f, labels = {}) {
  const chips = [];
  if (f.query) chips.push({ key: 'query', label: `"${f.query}"` });
  if (f.city) chips.push({ key: 'city', label: f.city });
  if (f.minPrice || f.maxPrice) {
    chips.push({ key: 'price', label: `${naira(f.minPrice || 0)} – ${f.maxPrice ? naira(f.maxPrice) : 'any'}` });
  }
  if (f.breakfast) chips.push({ key: 'breakfast', label: 'Breakfast included' });
  if (f.bedrooms) chips.push({ key: 'bedrooms', label: `${f.bedrooms}+ bedrooms` });
  if (f.bathrooms) chips.push({ key: 'bathrooms', label: `${f.bathrooms}+ bathrooms` });
  (f.ptypes || []).forEach((t) => chips.push({ key: 'ptypes', value: t, label: t }));
  if (f.minRating) chips.push({ key: 'minRating', label: `${f.minRating}+ rating` });
  if (f.seats) chips.push({ key: 'seats', label: `${f.seats}+ seats` });
  if (f.transmission) chips.push({ key: 'transmission', label: f.transmission });
  (f.classes || []).forEach((c) => chips.push({ key: 'classes', value: c, label: labels[c] || c }));
  (f.types || []).forEach((c) => chips.push({ key: 'types', value: c, label: labels[c] || c.replace(/_/g, ' ') }));
  (f.amenities || []).forEach((a) => chips.push({ key: 'amenities', value: a, label: a }));
  return chips;
}

export function removeChip(f, chip) {
  const next = { ...f };
  if (chip.key === 'price') {
    delete next.minPrice;
    delete next.maxPrice;
  } else if (Array.isArray(next[chip.key])) {
    next[chip.key] = next[chip.key].filter((v) => v !== chip.value);
    if (!next[chip.key].length) delete next[chip.key];
  } else {
    delete next[chip.key];
  }
  return next;
}

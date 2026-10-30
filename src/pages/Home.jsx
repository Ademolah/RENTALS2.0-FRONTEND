import { useState, useEffect, useMemo, useCallback } from 'react';
import PropertyCard from '../components/PropertyCard';
import CarCard from '../components/CarCard';
import HotelListingView from '../components/HotelCard';
import VipListingView from '../components/VipListingView';
import { getProperties } from '../api/properties';
import { getCars } from '../api/car';
import {
  Key, Building2, CarFront, Crown,
  ChevronRight, MapPin, Shield,
  Star, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FloatingPriceTag from '../components/FloatingPriceTag';
import BrowseShell from '../components/browse/BrowseShell';
import { SkeletonGrid, ErrorState, NoResults } from '../components/browse/States';
import { AMENITY_OPTIONS, CAR_CLASSES, applyFilters, sortItems, listingTag } from '../components/browse/meta';
import { useDocumentMeta } from '../lib/seo';

const SERVICES = [
  { key: 'shortlet', label: 'Shortlets', icon: Key, color: 'bg-brand-primary-soft text-brand-primary', desc: 'Luxury apartments' },
  { key: 'hotel', label: 'Hotels', icon: Building2, color: 'bg-blue-50 text-blue-600', desc: 'Premium suites' },
  { key: 'car', label: 'Car Rentals', icon: CarFront, color: 'bg-brand-purple-soft text-brand-purple', desc: 'Fleet rentals' },
  { key: 'vip', label: 'VIP', icon: Crown, color: 'bg-amber-50 text-amber-600', desc: 'Concierge service' },
];

const TRUST_BADGES = [
  { icon: Shield, label: 'Verified listings', desc: 'Every property inspected' },
  { icon: Star, label: 'Premium quality', desc: 'Curated selection only' },
  { icon: Clock, label: 'Instant booking', desc: 'Confirm in seconds' },
];

const HERO_COPY = {
  shortlet: 'Verified apartments and homes across Lagos and Abuja, managed by Rentals Africa.',
  hotel: 'Hand-picked hotels with real room availability in Lagos and Abuja.',
  car: 'Premium cars and chauffeurs, priced per 12 hours. Book a single day or extend.',
};

const SHORTLET_FILTERS = [
  { kind: 'city' },
  { kind: 'price', label: 'Price per night', max: 2000000, step: 25000 },
  { kind: 'stepper', key: 'bedrooms', label: 'Bedrooms', max: 10 },
  { kind: 'rating' },
  { kind: 'multi', key: 'amenities', label: 'Amenities', options: AMENITY_OPTIONS.map((a) => ({ value: a, label: a })) },
];

const CAR_FILTERS = [
  { kind: 'city' },
  { kind: 'price', label: 'Price per 12 hours', max: 1000000, step: 10000 },
  { kind: 'multi', key: 'classes', label: 'Vehicle class', options: CAR_CLASSES },
  { kind: 'single', key: 'transmission', label: 'Transmission', options: [{ value: 'automatic', label: 'Automatic' }, { value: 'manual', label: 'Manual' }] },
  { kind: 'stepper', key: 'seats', label: 'Seats', max: 12 },
  { kind: 'rating' },
];

const CLASS_LABELS = Object.fromEntries(CAR_CLASSES.map((c) => [c.value, c.label]));

function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-2xl md:text-[28px] font-display font-bold text-brand-dark tracking-tight">{title}</h2>
        {subtitle && <p className="text-base text-brand-text-secondary mt-1">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-1 text-base font-semibold text-brand-primary hover:text-brand-hover transition-colors group">
          <span>{action}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

export default function Home({
  searchFilters = {},
  activeCategory = 'SHORTLET',
  activeCityContext = 'Lagos',
  onCategoryChange
}) {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('recommended');

  const cat = activeCategory.toLowerCase();
  const isHotel = cat === 'hotel';
  const isVip = cat === 'vip' || cat === 'vip reservation';
  const isShortlet = cat === 'shortlet';
  const isCar = cat === 'car';

  useDocumentMeta(
    isCar ? 'Car rentals in Lagos and Abuja' : isHotel ? 'Hotels in Lagos and Abuja' : isVip ? 'VIP services' : 'Shortlets in Lagos and Abuja',
    'Verified stays, cars and VIP services in Lagos and Abuja, managed by Rentals Africa.'
  );

  useEffect(() => {
    setFilters({});
    setSort('recommended');
  }, [activeCategory]);

  const load = useCallback(async () => {
    if (isHotel || isVip) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const responseData = isCar ? await getCars() : await getProperties({ category: activeCategory });
      const results = Array.isArray(responseData)
        ? responseData
        : responseData?.data?.properties || responseData?.data?.cars || responseData?.properties || responseData?.cars || (Array.isArray(responseData?.data) ? responseData.data : []);
      setRaw(results);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setRaw([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, isHotel, isVip, isCar]);

  useEffect(() => { load(); }, [load]);

  const searchKey = JSON.stringify(searchFilters);

  const listings = useMemo(() => {
    let results = raw;
    const searchLoc = (searchFilters.location || '').toLowerCase().trim();
    const target = (filters.city || searchFilters.location || (isCar ? '' : activeCityContext) || '').toLowerCase().trim();

    if (target) {
      results = results.filter((item) => {
        const city = (item.address?.city || item.location?.city || '').toLowerCase();
        const state = (item.address?.state || item.location?.state || '').toLowerCase();
        const street = (item.address?.street || item.location?.street || '').toLowerCase();
        const title = (item.title || item.make || item.carModel || '').toLowerCase();
        return city.includes(target) || target.includes(city) ||
               state.includes(target) || target.includes(state) ||
               street.includes(target) || (isCar && searchLoc && title.includes(searchLoc));
      });
    }

    if (!isCar) {
      const guests = (Number(searchFilters.adults) || 0) + (Number(searchFilters.children) || 0);
      if (guests > 0) results = results.filter((p) => (p.maxGuests || p.capacity?.guests || 1) >= guests);
    }

    const start = searchFilters.checkIn || searchFilters.pickupDate;
    const end = searchFilters.checkOut || searchFilters.dropoffDate;
    if (start && end) {
      const reqStart = new Date(start).getTime();
      const reqEnd = new Date(end).getTime();
      results = results.filter((item) => {
        if (!Array.isArray(item.bookedDates) || item.bookedDates.length === 0) return true;
        return !item.bookedDates.some((b) => reqStart < new Date(b.endDate).getTime() && reqEnd > new Date(b.startDate).getTime());
      });
    }

    return sortItems(applyFilters(results, { ...filters, city: undefined }), sort);
  }, [raw, filters, sort, searchKey, activeCityContext, isCar]);

  const hasFilters = Object.keys(filters).length > 0;
  const showCuratedHome = isShortlet && !hasFilters && sort === 'recommended' && (!searchFilters.location || searchFilters.location === activeCityContext);
  const gridItems = showCuratedHome ? listings.slice(1) : listings;

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">

      {/* Hero */}
      {!isVip && (
        <section className="relative overflow-hidden rounded-3xl bg-brand-dark text-white mb-8 px-6 py-10 md:px-12 md:py-14 animate-fade-up">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-primary/15 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-5">
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-base font-semibold">{activeCityContext}, Nigeria</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">Stay Somewhere Exceptional</h1>
            <p className="mt-4 text-lg md:text-xl text-white/70 leading-relaxed">{HERO_COPY[cat] || HERO_COPY.shortlet}</p>
          </div>
        </section>
      )}

      {/* Services Grid */}
      {showCuratedHome && (
        <div className="mb-10 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              const isActive = cat === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => onCategoryChange?.(s.key)}
                  className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-dark border-brand-dark text-white shadow-card'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-card'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? 'bg-white/15' : s.color
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  </div>
                  <div className="text-left min-w-0">
                    <span className={`text-base font-semibold block ${isActive ? 'text-white' : 'text-brand-dark'}`}>{s.label}</span>
                    <span className={`text-sm block truncate ${isActive ? 'text-white/60' : 'text-brand-text-muted'}`}>{s.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isHotel ? (
        <HotelListingView activeCityContext={activeCityContext} searchFilters={searchFilters} />
      ) : isVip ? (
        <VipListingView
          defaultLocation={searchFilters.location || activeCityContext}
          defaultService={searchFilters.serviceType}
          defaultDate={searchFilters.date || searchFilters.checkIn}
        />
      ) : (
        <>
          {/* Featured card */}
          {showCuratedHome && !loading && !error && listings.length > 0 && (
            <div className="mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <Link
                to={`/property/${listings[0]._id}`}
                className="block relative rounded-2xl overflow-hidden aspect-[2.2/1] bg-gray-100 group"
              >
                <img
                  src={listings[0].images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'}
                  alt={listings[0].title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[800ms] ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-brand-dark text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md">Featured {listingTag(listings[0], 'shortlet')}</span>
                    {listings[0].isVerified && (
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md">Verified</span>
                    )}
                  </div>
                  <h3 className="text-white font-display font-bold text-2xl md:text-3xl mb-1">{listings[0].title}</h3>
                  <p className="text-white/70 text-base font-medium">
                    {listings[0].address?.city || activeCityContext}, {listings[0].address?.state || 'Nigeria'}
                  </p>
                  <p className="text-white font-display font-bold text-xl mt-2">
                    ₦{Number(listings[0].pricePerNight || listings[0].price || 0).toLocaleString()} <span className="text-white/60 text-base font-normal">/ night</span>
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Trust badges */}
          {showCuratedHome && (
            <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              {TRUST_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100/60">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-soft">
                      <Icon className="w-4 h-4 text-brand-dark" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-dark truncate">{badge.label}</p>
                      <p className="text-sm text-brand-text-muted truncate">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <BrowseShell
            config={isCar ? CAR_FILTERS : SHORTLET_FILTERS}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            total={listings.length}
            noun={isCar ? 'cars' : 'stays'}
            chipLabels={CLASS_LABELS}
          >
            {showCuratedHome && !loading && !error && listings.length > 1 && (
              <SectionHeader title="Recommended for you" subtitle={`${listings.length - 1} more in ${activeCityContext}`} />
            )}

            {loading ? (
              <SkeletonGrid count={8} className="xl:grid-cols-3" />
            ) : error ? (
              <ErrorState onRetry={load} />
            ) : listings.length === 0 ? (
              <NoResults
                hasFilters={hasFilters}
                onClear={() => setFilters({})}
                text={hasFilters ? undefined : `We couldn't find listings in ${filters.city || searchFilters.location || activeCityContext}. Try adjusting your search.`}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-10">
                {gridItems.map((item) => (
                  isCar ? (
                    <CarCard key={item._id} car={item} />
                  ) : (
                    <PropertyCard
                      key={item._id}
                      property={{
                        id: item._id,
                        title: item.title,
                        tag: listingTag(item, 'shortlet'),
                        location: item.address?.city && item.address?.state
                          ? `${item.address.city}, ${item.address.state}`
                          : item.address?.city || item.address?.state || `${activeCityContext}, Nigeria`,
                        price: Number(item.pricePerNight || item.price || 0),
                        rating: item.rating || 0,
                        numReviews: item.numReviews || 0,
                        isRentalVerified: item.isVerified ?? true,
                        images: item.images,
                        image: item.images && item.images.length > 0
                          ? item.images[0]
                          : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                  )
                ))}
              </div>
            )}
          </BrowseShell>
          <FloatingPriceTag />
        </>
      )}
    </main>
  );
}

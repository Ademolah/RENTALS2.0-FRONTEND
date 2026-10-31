import { useState, useEffect, useMemo, useCallback } from 'react';
import { CityBackdrop } from '../components/ui';
import PropertyCard from '../components/PropertyCard';
import CarCard from '../components/CarCard';
import HotelListingView from '../components/HotelCard';
import VipListingView from '../components/VipListingView';
import { getProperties } from '../api/properties';
import { getCars } from '../api/car';
import {
  Key, Building2, CarFront, Crown,
  ChevronRight, MapPin, Shield,
  Star, Clock, CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchGuestBookings } from '../api/trips';
import SearchBox from '../components/browse/SearchBox';
import ListingsMap from '../components/browse/ListingsMap';
import BrowseShell from '../components/browse/BrowseShell';
import { SkeletonGrid, ErrorState, NoResults } from '../components/browse/States';
import { AMENITY_OPTIONS, CAR_CLASSES, applyFilters, sortItems, listingTag } from '../components/browse/meta';
import { useDocumentMeta } from '../lib/seo';

const SERVICES = [
  { key: 'shortlet', label: 'Shortlets', icon: Key, desc: 'Apartments' },
  { key: 'hotel', label: 'Hotels', icon: Building2, desc: 'Suites' },
  { key: 'car', label: 'Car Rentals', icon: CarFront, desc: 'Fleet' },
  { key: 'vip', label: 'VIP', icon: Crown, desc: 'Concierge' },
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

const shortletFilters = (typeOptions) => [
  { kind: 'city' },
  { kind: 'price', label: 'Price per night', max: 2000000, step: 25000 },
  ...(typeOptions.length > 1 ? [{ kind: 'multi', key: 'ptypes', label: 'Property type', options: typeOptions }] : []),
  { kind: 'stepper', key: 'bedrooms', label: 'Bedrooms', max: 10 },
  { kind: 'stepper', key: 'bathrooms', label: 'Bathrooms', max: 10 },
  { kind: 'rating' },
  { kind: 'multi', key: 'amenities', label: 'Amenities', options: AMENITY_OPTIONS.map((a) => ({ value: a, label: a })) },
];

const isActiveFilters = (f) => Object.values(f).some((v) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0));

const greetingFor = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const fmtDay = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

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
  const [view, setView] = useState('list');
  const { user } = useAuth();
  const [nextTrip, setNextTrip] = useState(null);

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
    setFilters((f) => (f.query ? { query: f.query } : {}));
    setSort('recommended');
    setView('list');
  }, [activeCategory]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setNextTrip(null);
      return undefined;
    }
    fetchGuestBookings()
      .then((rows) => {
        if (!active) return;
        const upcoming = rows
          .filter((r) => r.bucket === 'upcoming' && r.start.getTime() > Date.now() - 24 * 3600 * 1000)
          .sort((a, b) => a.start - b.start);
        setNextTrip(upcoming[0] || null);
      })
      .catch(() => active && setNextTrip(null));
    return () => { active = false; };
  }, [user]);

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

  const hasFilters = isActiveFilters(filters);
  const typeOptions = useMemo(
    () => (isShortlet ? [...new Set(raw.map((i) => listingTag(i, 'shortlet')))].map((t) => ({ value: t, label: t })) : []),
    [raw, isShortlet]
  );
  const showCuratedHome = isShortlet && !hasFilters && sort === 'recommended' && (!searchFilters.location || searchFilters.location === activeCityContext);
  const gridItems = showCuratedHome ? listings.slice(1) : listings;

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">

      {/* Greeting + notifications */}
      {user && (
        <div className="flex items-center justify-between mb-5 animate-fade-up">
          <div>
            <p className="text-base text-brand-text-secondary">{greetingFor()}</p>
            <p className="text-2xl font-display font-bold text-brand-dark">{user.firstName || 'Welcome back'}</p>
          </div>
        </div>
      )}

      {/* Hero */}
      {!isVip && (
        <section className="relative overflow-hidden rounded-3xl bg-black text-white mb-8 px-6 py-10 md:px-12 md:py-14 animate-fade-up">
          <CityBackdrop tone="black" image={/abuja/i.test(activeCityContext) ? '/abuja.jpg' : '/lagos.jpg'} />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-5">
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-base font-semibold">{activeCityContext}, Nigeria</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">Stay Somewhere Exceptional</h1>
            <p className="mt-4 text-lg md:text-xl text-white/80 leading-relaxed">{HERO_COPY[cat] || HERO_COPY.shortlet}</p>
          </div>
        </section>
      )}

      {/* Category cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 animate-fade-up">
        {SERVICES.map((svc) => {
          const Icon = svc.icon;
          const active = cat === svc.key;
          return (
            <button
              key={svc.key}
              type="button"
              onClick={() => onCategoryChange?.(svc.key)}
              aria-pressed={active}
              className={`group relative h-[72px] lg:h-20 rounded-2xl px-3 lg:px-5 flex flex-row items-center gap-2.5 lg:gap-4 text-left overflow-hidden bg-gradient-to-br from-brand-dark via-brand-dark to-brand-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated ${
                active ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-white shadow-elevated' : 'ring-1 ring-white/10'
              }`}
            >
              <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
              <div className="relative w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="relative min-w-0">
                <p className="text-[15px] lg:text-lg font-display font-bold text-white leading-tight whitespace-nowrap">{svc.label}</p>
                <p className="text-xs lg:text-sm text-white/70 leading-tight mt-0.5">{svc.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {showCuratedHome && nextTrip && (
        <Link to="/trips" className="mb-10 flex items-center gap-5 p-4 pr-6 rounded-2xl border border-gray-100 bg-white shadow-card hover:shadow-card-hover transition-shadow animate-fade-up">
          <img src={nextTrip.image} alt="" className="w-24 h-20 rounded-xl object-cover bg-gray-100 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-primary">Your upcoming trip</p>
            <p className="text-lg font-display font-bold text-brand-dark truncate">{nextTrip.title}</p>
            <p className="text-base text-brand-text-secondary flex items-center gap-2">
              <CalendarDays className="w-4 h-4 shrink-0" />
              {fmtDay(nextTrip.start)}{nextTrip.end ? ` to ${fmtDay(nextTrip.end)}` : ''}
              <span className="text-brand-text-muted">· {nextTrip.reference}</span>
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
        </Link>
      )}

      <SearchBox
        value={filters.query || ''}
        onChange={(q) => setFilters((f) => {
          const next = { ...f };
          if (q) next.query = q; else delete next.query;
          return next;
        })}
        placeholder={isCar ? 'Search cars' : isHotel ? 'Search hotels' : isVip ? 'Search VIP' : 'Search stays'}
      />

      {isHotel ? (
        <HotelListingView activeCityContext={activeCityContext} searchFilters={searchFilters} query={filters.query} />
      ) : isVip ? (
        <VipListingView
          query={filters.query}
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
            <div className="mb-10 rounded-3xl bg-gradient-to-br from-gray-100 via-gray-100 to-gray-50 border border-gray-200/70 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              {TRUST_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className="flex items-center gap-4 px-6 py-5">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-card ring-1 ring-gray-200/60">
                      <Icon className="w-5 h-5 text-brand-dark" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-brand-dark truncate">{badge.label}</p>
                      <p className="text-sm text-brand-text-secondary truncate">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <BrowseShell
            config={isCar ? CAR_FILTERS : shortletFilters(typeOptions)}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            total={listings.length}
            noun={isCar ? 'cars' : 'stays'}
            chipLabels={CLASS_LABELS}
            view={view}
            setView={setView}
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
            ) : view === 'map' ? (
              <ListingsMap
                items={listings}
                hrefFor={(item) => (isCar ? `/cars/${item._id}` : `/property/${item._id}`)}
                titleFor={(item) => (isCar ? [item.make, item.carModel].filter(Boolean).join(' ') || 'Car' : item.title)}
                imageFor={(item) => item.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'}
                subtitleFor={(item) => [(item.address || item.location)?.city, (item.address || item.location)?.state].filter(Boolean).join(', ')}
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
          
        </>
      )}
    </main>
  );
}

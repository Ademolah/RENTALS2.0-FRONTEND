import { useState, useEffect } from 'react';
import PropertyCard from '../components/PropertyCard';
import CarCard from '../components/CarCard';
import HotelListingView from '../components/HotelCard';
import VipListingView from '../components/VipListingView';
import { getProperties } from '../api/properties';
import { getCars } from '../api/car';
import {
  Loader2, Search, Key, Building2, CarFront, Crown,
  ChevronRight, MapPin, Sparkles, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FloatingPriceTag from '../components/FloatingPriceTag';

const SERVICES = [
  { key: 'shortlet', label: 'Shortlets', icon: Key, color: 'bg-brand-primary-soft text-brand-primary', desc: 'Verified luxury apartments' },
  { key: 'hotel', label: 'Hotels', icon: Building2, color: 'bg-brand-accent-soft text-brand-accent', desc: 'Premium hotel suites' },
  { key: 'car', label: 'Car Rentals', icon: CarFront, color: 'bg-brand-purple-soft text-brand-purple', desc: 'Affordable fleet rentals' },
  { key: 'vip', label: 'VIP', icon: Crown, color: 'bg-brand-warning-soft text-brand-warning', desc: 'Exclusive concierge' },
];

function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-display font-bold text-brand-dark tracking-tight">{title}</h2>
      {action && (
        <button onClick={onAction} className="flex items-center space-x-1 text-sm font-semibold text-brand-primary hover:text-brand-hover transition-colors">
          <span>{action}</span>
          <ChevronRight className="w-4 h-4" />
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
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      const normalizedCategory = activeCategory.toLowerCase();

      if (normalizedCategory === 'hotel' || normalizedCategory === 'vip reservation' || normalizedCategory === 'vip') {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let responseData;

        if (normalizedCategory === 'car') {
          responseData = await getCars();
        } else {
          responseData = await getProperties({ category: activeCategory });
        }

        let results = Array.isArray(responseData)
          ? responseData
          : responseData?.data?.properties || responseData?.data?.cars || responseData?.properties || responseData?.cars || (Array.isArray(responseData?.data) ? responseData.data : []);

        const targetCity = (searchFilters.location && searchFilters.location.trim() !== '')
          ? searchFilters.location.toLowerCase().trim()
          : activeCityContext.toLowerCase().trim();

        if (normalizedCategory !== 'car') {
          results = results.filter(item => {
            const city = (item.address?.city || item.location?.city || '').toLowerCase();
            const state = (item.address?.state || item.location?.state || '').toLowerCase();
            const street = (item.address?.street || item.location?.street || '').toLowerCase();
            return city.includes(targetCity) || targetCity.includes(city) ||
                   state.includes(targetCity) || targetCity.includes(state) ||
                   street.includes(targetCity);
          });
        }

        if (searchFilters.location && searchFilters.location.trim() !== '' && normalizedCategory === 'car') {
          const searchStr = searchFilters.location.toLowerCase().trim();
          results = results.filter(item => {
            const city = (item.address?.city || item.location?.city || '').toLowerCase();
            const state = (item.address?.state || item.location?.state || '').toLowerCase();
            const title = (item.title || item.make || item.carModel || '').toLowerCase();
            return city.includes(searchStr) || searchStr.includes(city) ||
                   state.includes(searchStr) || searchStr.includes(state) ||
                   title.includes(searchStr);
          });
        }

        if (normalizedCategory !== 'car') {
          const requestedGuests = (Number(searchFilters.adults) || 0) + (Number(searchFilters.children) || 0);
          if (requestedGuests > 0) {
            results = results.filter(prop => (prop.maxGuests || prop.capacity?.guests || 1) >= requestedGuests);
          }
        }

        const requestedStart = searchFilters.checkIn || searchFilters.pickupDate;
        const requestedEnd = searchFilters.checkOut || searchFilters.dropoffDate;

        if (requestedStart && requestedEnd && Array.isArray(results)) {
          const reqStartMs = new Date(requestedStart).getTime();
          const reqEndMs = new Date(requestedEnd).getTime();

          results = results.filter(item => {
            if (!item.bookedDates || !Array.isArray(item.bookedDates) || item.bookedDates.length === 0) {
              return true;
            }
            const hasOverlap = item.bookedDates.some(booking => {
              const existingStart = new Date(booking.startDate).getTime();
              const existingEnd = new Date(booking.endDate).getTime();
              return reqStartMs < existingEnd && reqEndMs > existingStart;
            });
            return !hasOverlap;
          });
        }

        setListings(results);
      } catch (err) {
        console.error("Failed to load listings:", err);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [activeCategory, activeCityContext, JSON.stringify(searchFilters)]);

  const isHotel = activeCategory.toLowerCase() === 'hotel';
  const isVip = activeCategory.toLowerCase() === 'vip' || activeCategory.toLowerCase() === 'vip reservation';
  const isShortlet = activeCategory.toLowerCase() === 'shortlet';
  const isCar = activeCategory.toLowerCase() === 'car';

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">

      {/* ─── City Bar (matches mobile dark gradient city selector) ─── */}
      {isShortlet && !searchFilters.location && (
        <div className="mb-6 rounded-2xl overflow-hidden bg-gradient-to-r from-brand-accent to-brand-dark p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Browsing in</p>
            <p className="text-white font-display font-bold text-base truncate">{activeCityContext}, Nigeria</p>
          </div>
        </div>
      )}

      {/* ─── Services Grid (matches mobile "Our services" row) ─── */}
      {isShortlet && !searchFilters.location && (
        <div className="mb-8">
          <SectionHeader title="Our services" />
          <div className="grid grid-cols-4 gap-3">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => onCategoryChange?.(s.key)}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-white shadow-soft border border-gray-100/60 hover:shadow-card hover:border-gray-200 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-full ${s.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-brand-dark">{s.label}</span>
                  <span className="text-[10px] text-brand-text-muted hidden sm:block">{s.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Hotel View ─── */}
      {isHotel ? (
        <HotelListingView activeCityContext={activeCityContext} searchFilters={searchFilters} />
      ) : isVip ? (
        <VipListingView
          defaultLocation={searchFilters.location || activeCityContext}
          defaultService={searchFilters.serviceType}
          defaultDate={searchFilters.date || searchFilters.checkIn}
        />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-brand-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
          <p className="text-sm font-medium">Finding available listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-brand-accent-soft p-5 rounded-full mb-4">
            <Search className="w-7 h-7 text-brand-text-muted" />
          </div>
          <h3 className="text-xl font-display font-bold text-brand-dark">No exact matches</h3>
          <p className="text-brand-text-secondary text-sm mt-2 mb-8 max-w-sm mx-auto leading-relaxed">
            We couldn't find listings matching your criteria in {activeCityContext}. Try adjusting your search.
          </p>
        </div>
      ) : (
        <>
          {/* Car Hero Banner */}
          {isCar && (
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-dark mb-3 tracking-tight">
                Save More, <span className="text-brand-primary">Travel More.</span>
              </h2>
              <p className="text-brand-text-secondary text-base font-medium max-w-xl mx-auto">
                Affordable, premium car rentals for your trips and city tours.
              </p>
            </div>
          )}

          {/* Featured (first listing, highlighted) */}
          {isShortlet && listings.length > 0 && !searchFilters.location && (
            <div className="mb-8">
              <SectionHeader title="Featured" />
              <Link
                to={`/property/${listings[0]._id}`}
                className="block relative rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-gray-100 group"
              >
                <img
                  src={listings[0].images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"}
                  alt={listings[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">Featured</span>
                    {listings[0].isVerified && (
                      <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">Verified</span>
                    )}
                  </div>
                  <h3 className="text-white font-display font-bold text-xl md:text-2xl mb-1 drop-shadow-md">{listings[0].title}</h3>
                  <p className="text-white/80 text-sm font-medium">
                    {listings[0].address?.city || activeCityContext}, {listings[0].address?.state || 'Nigeria'}
                  </p>
                  <p className="text-white font-display font-bold text-lg mt-2">
                    ₦{Number(listings[0].pricePerNight || listings[0].price || 0).toLocaleString()} <span className="text-white/60 text-sm font-normal">/ night</span>
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Recommended / Listings Grid */}
          <div>
            {isShortlet && !searchFilters.location && (
              <SectionHeader title="Recommended for you" />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 gap-y-8">
              {(isShortlet && !searchFilters.location ? listings.slice(1) : listings).map((item) => (
                isCar ? (
                  <CarCard key={item._id} car={item} />
                ) : (
                  <PropertyCard
                    key={item._id}
                    property={{
                      id: item._id,
                      title: item.title,
                      location: item.address?.city && item.address?.state
                        ? `${item.address.city}, ${item.address.state}`
                        : item.address?.city || item.address?.state || `${activeCityContext}, Nigeria`,
                      price: Number(item.pricePerNight || item.price || 0),
                      rating: item.rating || 0,
                      numReviews: item.numReviews || 0,
                      dates: "Available Now",
                      isRentalVerified: item.isVerified ?? true,
                      isAvailable: item.isAvailable,
                      images: item.images,
                      image: item.images && item.images.length > 0
                        ? item.images[0]
                        : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
                    }}
                  />
                )
              ))}
            </div>
          </div>
          <FloatingPriceTag />
        </>
      )}
    </main>
  );
}

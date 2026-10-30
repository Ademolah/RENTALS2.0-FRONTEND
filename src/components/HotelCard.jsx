import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin, Star, Coffee, Wifi, ChevronRight, Clock,
  Droplets, Bed, Utensils, Car, CheckCircle2, Wine, Users, Leaf
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getHotels } from '../api/hotel';
import FavoriteHeart from './browse/FavoriteHeart';
import BrowseShell from './browse/BrowseShell';
import { SkeletonGrid, ErrorState, NoResults } from './browse/States';
import { AMENITY_OPTIONS, applyFilters, sortItems, listingTag } from './browse/meta';

const getAmenityIcon = (amenity) => {
  if (!amenity) return CheckCircle2;
  const name = amenity.toLowerCase();
  if (name.includes('wifi') || name.includes('internet')) return Wifi;
  if (name.includes('pool') || name.includes('swim')) return Droplets;
  if (name.includes('bed') || name.includes('room') || name.includes('suite')) return Bed;
  if (name.includes('food') || name.includes('restaurant') || name.includes('dining')) return Utensils;
  if (name.includes('bar') || name.includes('lounge')) return Wine;
  if (name.includes('park') || name.includes('valet') || name.includes('garage')) return Car;
  if (name.includes('spa') || name.includes('massage')) return Leaf;
  if (name.includes('gym') || name.includes('fitness')) return Users;
  return CheckCircle2;
};

const PremiumHotelCard = ({ hotel }) => {
  const coverImage = hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
  const locationString = hotel.address ? `${hotel.address.city}, ${hotel.address.state}` : 'Location unavailable';
  const displayAmenities = hotel.amenities ? hotel.amenities.slice(0, 3) : [];
  const reviewsCount = hotel.numReviews || hotel.reviewsCount || 0;
  const rating = hotel.rating || 0;

  const getRatingText = (val) => {
    if (val >= 4.5) return 'Superb';
    if (val >= 4.0) return 'Very Good';
    if (val >= 3.0) return 'Good';
    return 'Fair';
  };

  const displayUrgency = hotel.urgency || null;

  return (
    <Link to={`/hotel/${hotel._id}`} className="group block h-full">
      <div className="bg-white border border-gray-100 hover:border-brand-dark/20 transition-all duration-300 overflow-hidden relative flex flex-col h-full rounded-2xl shadow-soft hover:shadow-card">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={coverImage}
            alt={hotel.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <span className="bg-brand-dark text-white px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">{listingTag(hotel, 'hotel')}</span>
            <FavoriteHeart id={hotel._id} />
          </div>

          {/* Rating Badge */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <span className="text-white font-semibold text-sm drop-shadow-md">
                {reviewsCount > 0 ? getRatingText(rating) : 'New'}
              </span>
              <span className="text-white/80 text-xs font-medium drop-shadow-md">
                {reviewsCount} review{reviewsCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="bg-brand-accent text-white font-display font-bold text-base px-2.5 py-1.5 rounded-xl shadow-lg">
              {reviewsCount > 0 ? rating.toFixed(1) : 'New'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-brand-dark tracking-tight group-hover:text-brand-primary transition-colors truncate mb-1">
              {hotel.title}
            </h3>

            <div className="flex items-center text-brand-text-secondary text-sm font-medium mb-3">
              <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="truncate">{locationString}</span>
            </div>

            {/* Amenity Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayAmenities.map((amenity, idx) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <span key={idx} className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-brand-text-secondary bg-brand-accent-soft px-2 py-1 rounded-md">
                    <Icon className="w-3 h-3 mr-1" /> {amenity}
                  </span>
                );
              })}
              {hotel.hasBreakfast && displayAmenities.length <= 3 && (
                <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-status-available bg-status-available-soft px-2 py-1 rounded-md">
                  <Coffee className="w-3 h-3 mr-1" /> Breakfast
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-2">
            {displayUrgency && (
              <div className="flex items-center text-brand-primary text-sm font-semibold">
                <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span className="truncate">{displayUrgency}</span>
              </div>
            )}

            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">From</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-display font-bold text-brand-dark">₦{hotel.startingPrice?.toLocaleString()}</span>
                  <span className="text-brand-text-muted text-sm">/ night</span>
                </div>
              </div>

              <div className="bg-brand-dark text-white p-2.5 rounded-xl group-hover:bg-brand-primary transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const HOTEL_FILTERS = [
  { kind: 'city' },
  { kind: 'price', label: 'Price per night', max: 2000000, step: 25000 },
  { kind: 'rating' },
  { kind: 'single', key: 'breakfast', label: 'Meals', options: [{ value: true, label: 'Breakfast included' }] },
  { kind: 'multi', key: 'amenities', label: 'Amenities', options: AMENITY_OPTIONS.map((a) => ({ value: a, label: a })) },
];

export default function HotelListingView({ activeCityContext }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({ city: activeCityContext || 'Lagos' });
  const [sort, setSort] = useState('recommended');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await getHotels();
      const fetched = response?.data?.hotels || response?.data?.properties || response?.data || [];
      setHotels(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(
    () => sortItems(applyFilters(hotels, filters, { custom: (h, f) => !f.breakfast || h.hasBreakfast }), sort),
    [hotels, filters, sort]
  );
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="w-full">
      <BrowseShell config={HOTEL_FILTERS} filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} total={visible.length} noun="hotels" chipLabels={{}}>
        {loading ? (
          <SkeletonGrid count={6} className="xl:grid-cols-3" />
        ) : error ? (
          <ErrorState onRetry={load} message="We couldn't load hotels. Check your connection and try again." />
        ) : visible.length === 0 ? (
          <NoResults hasFilters={hasFilters} onClear={() => setFilters({})} text={hasFilters ? undefined : 'We are expanding our hotel portfolio. Check back soon.'} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((hotel) => <PremiumHotelCard key={hotel._id} hotel={hotel} />)}
          </div>
        )}
      </BrowseShell>
    </div>
  );
}

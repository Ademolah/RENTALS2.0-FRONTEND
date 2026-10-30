import { useState, useEffect } from 'react';
import {
  MapPin, Star, Coffee, Wifi, ChevronRight, Clock,
  Droplets, Bed, Utensils, Car, CheckCircle2, Wine, Loader2, Users, Leaf
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getHotels } from '../api/hotel';

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

  const mockUrgencies = [
    "Only 2 rooms left on our site",
    "Booked 4 times in the last 24 hours",
    "High demand - 6 looking right now",
    "Last booked 1 hour ago",
    null
  ];
  const charCode = hotel._id ? hotel._id.charCodeAt(hotel._id.length - 1) : 0;
  const displayUrgency = hotel.urgency || mockUrgencies[charCode % mockUrgencies.length];

  return (
    <Link to={`/hotel/${hotel._id}`} className="group block h-full">
      <div className="bg-white border border-gray-100 hover:border-brand-dark/20 transition-all duration-300 overflow-hidden relative flex flex-col h-full rounded-2xl shadow-soft hover:shadow-card">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={coverImage}
            alt={hotel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <span className="text-white font-semibold text-sm drop-shadow-md">
                {reviewsCount > 0 ? getRatingText(rating) : 'New'}
              </span>
              <span className="text-white/80 text-[10px] font-medium drop-shadow-md">
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
            <h3 className="text-lg font-display font-bold text-brand-dark tracking-tight group-hover:text-brand-primary transition-colors truncate mb-1">
              {hotel.title}
            </h3>

            <div className="flex items-center text-brand-text-secondary text-xs font-medium mb-3">
              <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="truncate">{locationString}</span>
            </div>

            {/* Amenity Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayAmenities.map((amenity, idx) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <span key={idx} className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-brand-text-secondary bg-brand-accent-soft px-2 py-1 rounded-md">
                    <Icon className="w-3 h-3 mr-1" /> {amenity}
                  </span>
                );
              })}
              {hotel.hasBreakfast && displayAmenities.length <= 3 && (
                <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-status-available bg-status-available-soft px-2 py-1 rounded-md">
                  <Coffee className="w-3 h-3 mr-1" /> Breakfast
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-2">
            {displayUrgency && (
              <div className="flex items-center text-brand-primary text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span className="truncate">{displayUrgency}</span>
              </div>
            )}

            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider">From</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-display font-bold text-brand-dark">₦{hotel.startingPrice?.toLocaleString()}</span>
                  <span className="text-brand-text-muted text-xs">/ night</span>
                </div>
              </div>

              <div className="bg-brand-dark text-white p-2 rounded-xl group-hover:bg-brand-primary transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function HotelListingView() {
  const [activeState, setActiveState] = useState('Lagos');
  const [msgIndex, setMsgIndex] = useState(0);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const messages = ["Find your next stay", "Experience true luxury", "Unwind in premium suites"];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const response = await getHotels();
        const fetchedHotels = response?.data?.hotels || response?.data?.properties || response?.data || [];
        setHotels(Array.isArray(fetchedHotels) ? fetchedHotels : []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch hotels:", err);
        setError("Unable to load hotels at this time.");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const filteredHotels = hotels.filter(hotel => hotel.address?.state === activeState);

  return (
    <div className="w-full">
      {/* Hero Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden mb-10 h-36 sm:h-48 md:h-56 flex items-center justify-center bg-brand-dark">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative w-full px-4 flex flex-col items-center justify-center text-center">
          <div className="relative h-12 sm:h-16 md:h-20 w-full flex items-center justify-center">
            {messages.map((msg, i) => {
              let positionClass = "opacity-0 translate-x-12";
              if (i === msgIndex) positionClass = "opacity-100 translate-x-0";
              else if (i === (msgIndex - 1 + messages.length) % messages.length) positionClass = "opacity-0 -translate-x-12";

              return (
                <h1 key={msg} className={`absolute w-full text-2xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-[#FF9B71] to-brand-primary bg-[length:200%_auto] animate-[gradient_4s_linear_infinite] transition-all duration-1000 ease-out ${positionClass}`}>
                  {msg}
                </h1>
              );
            })}
          </div>
        </div>
      </div>

      {/* State Tabs */}
      <div className="flex flex-col items-center mb-8">
        <div className="inline-flex bg-brand-accent-soft p-1 rounded-full border border-gray-100">
          {['Lagos', 'Abuja'].map((stateName) => (
            <button
              key={stateName}
              onClick={() => setActiveState(stateName)}
              className={`relative px-7 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeState === stateName
                  ? 'text-white bg-brand-dark shadow-md'
                  : 'text-brand-text-secondary hover:text-brand-dark'
              }`}
            >
              {stateName}
            </button>
          ))}
        </div>
      </div>

      {/* Hotel Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
          <p className="text-brand-text-secondary font-medium">Loading hotels...</p>
        </div>
      ) : error ? (
        <div className="text-center py-24 text-red-500 font-medium">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredHotels.length > 0 ? (
            filteredHotels.map((hotel) => <PremiumHotelCard key={hotel._id} hotel={hotel} />)
          ) : (
            <div className="col-span-full py-24 text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-brand-accent-soft rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-brand-text-muted" />
              </div>
              <h3 className="text-lg font-display font-bold text-brand-dark">No hotels available</h3>
              <p className="text-brand-text-secondary mt-2 text-sm">Expanding our portfolio in {activeState}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

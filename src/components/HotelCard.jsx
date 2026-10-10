import { useState, useEffect } from 'react';
import { 
  MapPin, Star, Coffee, Wifi, Sparkles, ChevronRight, Clock, 
  Droplets, Bed, Utensils, Car, CheckCircle2, Wine, Loader2 , Users
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
  if (name.includes('spa') || name.includes('massage')) return Sparkles;
  if (name.includes('gym') || name.includes('fitness')) return Users;
  return CheckCircle2; 
};

const PremiumHotelCard = ({ hotel }) => {
  const coverImage = hotel.images && hotel.images.length > 0 ? hotel.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
  const locationString = hotel.address ? `${hotel.address.city}, ${hotel.address.state}` : 'Location unavailable';
  const displayAmenities = hotel.amenities ? hotel.amenities.slice(0, 3) : [];
  
  // 💡 SURGICAL FIX: Pull true production data from the backend model
  const reviewsCount = hotel.numReviews || hotel.reviewsCount || 0;
  const rating = hotel.rating || 0;

  // Dynamic rating text generator based on real scores
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
      <div className="bg-white border border-gray-200 hover:border-gray-900 transition-colors duration-300 overflow-hidden relative flex flex-col h-full rounded-2xl shadow-sm hover:shadow-xl">
        
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img 
            src={coverImage} 
            alt={hotel.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          />
          
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <span className="text-white font-bold text-sm drop-shadow-md">
                {reviewsCount > 0 ? getRatingText(rating) : 'New Listing'}
              </span>
              <span className="text-white text-[10px] font-medium drop-shadow-md">
                {reviewsCount} review{reviewsCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="bg-brand-primary text-white font-black text-lg px-2.5 py-1.5 rounded-t-xl rounded-bl-xl rounded-br-sm shadow-lg">
              {reviewsCount > 0 ? rating.toFixed(1) : 'New'}
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-brand-primary transition-colors truncate">
                {hotel.title}
              </h3>
            </div>
            
            <div className="flex items-center text-gray-500 text-xs font-medium mb-4">
              <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="underline decoration-gray-300 underline-offset-2 truncate">{locationString}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {displayAmenities.map((amenity, idx) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <span key={idx} className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
                    <Icon className="w-3 h-3 mr-1.5" /> {amenity}
                  </span>
                );
              })}
              {hotel.hasBreakfast && displayAmenities.length <= 3 && (
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-md">
                  <Coffee className="w-3 h-3 mr-1.5" /> Breakfast
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col">
            <div className="min-h-[20px] mb-2">
              {displayUrgency && (
                <div className="flex items-center text-[#D32F2F] text-xs font-bold animate-in fade-in duration-500">
                  <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{displayUrgency}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Starting from</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-gray-900">₦{hotel.startingPrice?.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs font-medium">/ night</span>
                </div>
              </div>
              
              <div className="bg-gray-900 text-white p-2.5 rounded-xl group-hover:bg-brand-primary transition-colors">
                <ChevronRight className="w-5 h-5" />
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
    <div className="w-full animate-in fade-in duration-700">
      <div className="relative w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl h-36 sm:h-48 md:h-64 flex items-center justify-center">
        <div className="absolute inset-0 bg-[#0A0A0A]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="relative w-full px-4 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="relative h-12 sm:h-16 md:h-24 w-full flex items-center justify-center">
            {messages.map((msg, i) => {
              let positionClass = "opacity-0 translate-x-12"; 
              if (i === msgIndex) positionClass = "opacity-100 translate-x-0"; 
              else if (i === (msgIndex - 1 + messages.length) % messages.length) positionClass = "opacity-0 -translate-x-12"; 
              
              return (
                <h1 key={msg} className={`absolute w-full text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#F25F5C] via-[#FF9B71] to-[#F25F5C] bg-[length:200%_auto] animate-[gradient_4s_linear_infinite] transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${positionClass}`}>
                  {msg}
                </h1>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mb-10">
        <div className="inline-flex bg-gray-100/80 p-1.5 rounded-full border border-gray-200 backdrop-blur-sm">
          {['Lagos', 'Abuja'].map((stateName) => (
            <button
              key={stateName}
              onClick={() => setActiveState(stateName)}
              className={`relative px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${activeState === stateName ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
            >
              {activeState === stateName && <div className="absolute inset-0 bg-gray-900 rounded-full shadow-md" />}
              <span className="relative z-10">{stateName}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
          <p className="text-gray-500 font-medium tracking-wide">Loading exclusive hotels...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 font-medium">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {filteredHotels.length > 0 ? (
            filteredHotels.map((hotel) => <PremiumHotelCard key={hotel._id} hotel={hotel} />)
          ) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No hotels available</h3>
              <p className="text-gray-500 mt-2">We are currently expanding our exclusive portfolio in {activeState}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
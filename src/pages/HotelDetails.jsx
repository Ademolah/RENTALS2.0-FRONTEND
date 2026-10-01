import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Star, Coffee, Wifi, ChevronLeft, ChevronRight, 
  Droplets, Bed, Utensils, Car, CheckCircle2, Wine, 
  CalendarDays, Users, Info, ArrowLeft, AlertCircle, Loader2, ArrowRight,
  Dumbbell, Sparkles // Added the missing modal icons here
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BookModal from '../components/BookModal';
import InteractiveMap from '../components/InteractiveMap';
import { getHotelById } from '../api/hotel';

// SURGICAL FIX: Perfectly synced to match CreateHotelModal.jsx PRESET_AMENITIES
const getAmenityIcon = (amenity) => {
  if (!amenity) return CheckCircle2;
  const name = amenity.toLowerCase();
  
  if (name.includes('wifi') || name.includes('internet')) return Wifi;
  if (name.includes('pool') || name.includes('swim')) return Droplets;
  if (name.includes('restaurant') || name.includes('dining') || name.includes('food')) return Utensils;
  if (name.includes('fitness') || name.includes('gym')) return Dumbbell;
  if (name.includes('bar') || name.includes('lounge')) return Wine;
  if (name.includes('spa') || name.includes('wellness')) return Sparkles;
  if (name.includes('valet') || name.includes('park')) return Car;
  if (name.includes('room service')) return Coffee;
  
  // Fallbacks for room-specific amenities
  if (name.includes('bed') || name.includes('room') || name.includes('suite')) return Bed;
  
  return CheckCircle2; 
};

export default function HotelDetails() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const galleryRef = useRef(null);
  
  const isLoggedIn = Boolean(localStorage.getItem('rentals_token'));

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true);
        const response = await getHotelById(id);
        const data = response?.data?.hotel || response?.data?.property || response?.data || response;
        setHotel(data);
        if (data.roomTypes && data.roomTypes.length > 0) {
          setSelectedRoom(data.roomTypes[0]._id);
        }
      } catch (err) {
        console.error("Failed to load hotel:", err);
        setError("Unable to load hotel details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHotel();
  }, [id]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBookClick = () => {
    if (!isLoggedIn) {
      showToast("Please log in or register to secure a reservation.");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      showToast("Please select your check-in and check-out dates.");
      return;
    }
    setIsBookModalOpen(true);
  };

  const scrollGallery = (direction) => {
    if (galleryRef.current) {
      const scrollAmount = window.innerWidth * 0.6; 
      galleryRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 1;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Select Date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-brand-primary mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Loading your stay...</h2>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Oops!</h2>
        <p className="text-gray-600">{error || "Hotel not found."}</p>
        <button onClick={() => navigate(-1)} className="mt-6 bg-gray-900 text-white px-6 py-2 rounded-xl">Go Back</button>
      </div>
    );
  }

  const activeRoomData = hotel.roomTypes?.find(r => r._id === selectedRoom);
  const nights = calculateNights();
  const basePricePerNight = activeRoomData?.pricePerNight || hotel.startingPrice || 0;
  const totalPrice = basePricePerNight * nights;

  return (
    <main className="bg-gray-50 min-h-screen pb-32 lg:pb-12 relative">
      
      {/* 1. SCROLLABLE IMAGE GALLERY */}
      <div className="w-full bg-black overflow-hidden relative group">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-30 bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition shadow-md">
          <ArrowLeft className="w-6 h-6" />
        </button>

       <button onClick={() => scrollGallery('left')} className="absolute top-1/2 left-4 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary transition opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-xl">
          <ChevronLeft className="w-8 h-8" />
        </button>
        
        <button onClick={() => scrollGallery('right')} className="absolute top-1/2 right-4 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary transition opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-xl">
          <ChevronRight className="w-8 h-8" />
        </button>
        
        <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-[40vh] md:h-[60vh] scroll-smooth">
          {hotel.images?.map((img, index) => (
            <div key={index} className="min-w-[85vw] md:min-w-[60vw] lg:min-w-[45vw] h-full snap-center relative p-1">
              <img src={img} alt={`${hotel.title} - view ${index + 1}`} className="w-full h-full object-cover rounded-2xl" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-2/3 space-y-10">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  {hotel.title}
                </h1>
                <div className="hidden md:flex flex-col items-end ml-4">
                  <div className="bg-blue-900 text-white font-black text-xl px-4 py-2 rounded-xl shadow-lg">
                    {hotel.rating ? hotel.rating.toFixed(1) : '9.0'}
                  </div>
                  <span className="text-sm font-bold text-gray-500 mt-1">{hotel.reviewsCount || 'New'} reviews</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600 text-sm font-medium mb-6">
                <MapPin className="w-5 h-5 mr-2 text-brand-primary shrink-0" />
                <span className="text-lg">{hotel.address?.street}, {hotel.address?.city}, {hotel.address?.state}</span>
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this property</h2>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {hotel.description}
              </p>
            </div>

            {hotel.amenities && hotel.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Premium Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  {hotel.amenities.map((amenity, idx) => {
                    const Icon = getAmenityIcon(amenity);
                    return (
                      <div key={idx} className="flex items-center text-gray-700 font-medium">
                        <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
                          <Icon className="w-5 h-5 text-brand-primary" />
                        </div>
                        {amenity}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <hr className="border-gray-200" />

            <div id="dates-section" className="bg-gradient-to-br from-blue-900 to-brand-primary rounded-[2rem] p-1 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="bg-white rounded-[1.8rem] p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <CalendarDays className="w-7 h-7 mr-3 text-blue-600" />
                  When will you be staying?
                </h2>
                
                <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-50 p-2 md:p-3 rounded-3xl border border-gray-100 shadow-inner">
                  
                  {/* CHECK IN BLOCK */}
                  <div className="relative w-full md:w-1/2 bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent focus-within:border-blue-500 hover:shadow-md transition-all group overflow-hidden">
                    <div className="flex justify-between items-center relative z-10 pointer-events-none">
                      <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Check-in</p>
                        <p className={`text-xl md:text-2xl font-black tracking-tight ${checkInDate ? 'text-gray-900' : 'text-gray-300'}`}>
                          {formatDisplayDate(checkInDate)}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full transition-colors ${checkInDate ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
                        <CalendarDays className="w-5 h-5" />
                      </div>
                    </div>
                    {/* Native invisible input overlaid on top */}
                    <input 
                      type="date" 
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                  </div>

                  {/* SEPARATOR (Desktop only) */}
                  <div className="hidden md:flex items-center justify-center px-2">
                    <ArrowRight className="w-6 h-6 text-gray-300" />
                  </div>

                  {/* CHECK OUT BLOCK */}
                  <div className="relative w-full md:w-1/2 bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent focus-within:border-brand-primary hover:shadow-md transition-all group overflow-hidden">
                    <div className="flex justify-between items-center relative z-10 pointer-events-none">
                      <div>
                        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">Check-out</p>
                        <p className={`text-xl md:text-2xl font-black tracking-tight ${checkOutDate ? 'text-gray-900' : 'text-gray-300'}`}>
                          {formatDisplayDate(checkOutDate)}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full transition-colors ${checkOutDate ? 'bg-orange-100 text-brand-primary' : 'bg-gray-50 text-gray-300'}`}>
                        <CalendarDays className="w-5 h-5" />
                      </div>
                    </div>
                    {/* Native invisible input overlaid on top */}
                    <input 
                      type="date" 
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                  </div>

                </div>

                {/* SUCCESS MESSAGE */}
                <div className={`mt-6 overflow-hidden transition-all duration-500 ease-in-out ${checkInDate && checkOutDate ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="flex items-center text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-xl shadow-lg">
                    <div className="bg-white/20 p-1.5 rounded-full mr-3">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    Perfect! You're booking a {nights}-night stay.
                  </div>
                </div>

              </div>
            </div>

            <hr className="border-gray-200" />

            <div id="rooms-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Rooms</h2>
              <div className="space-y-6">
                {hotel.roomTypes?.map((room) => {
                  const isSelected = selectedRoom === room._id;
                  const roomImage = room.images && room.images.length > 0 ? room.images[0] : hotel.images[0];
                  
                  return (
                    <div 
                      key={room._id} 
                      onClick={() => setSelectedRoom(room._id)}
                      className={`flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        isSelected ? 'border-brand-primary ring-4 ring-brand-primary/10' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full sm:w-1/3 h-48 sm:h-auto">
                        <img src={roomImage} alt={room.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-brand-primary' : 'border-gray-300'}`}>
                              {isSelected && <div className="w-3 h-3 bg-brand-primary rounded-full" />}
                            </div>
                          </div>
                          <div className="flex items-center text-gray-500 text-sm mt-2 mb-4 space-x-4">
                            <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {room.capacity?.adults || 2} Adults</span>
                            <span className="flex items-center"><Bed className="w-4 h-4 mr-1" /> Room</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {room.amenities?.map((am, i) => (
                              <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
                          <span className="text-2xl font-black text-gray-900">
                            ₦{room.pricePerNight.toLocaleString()} <span className="text-sm font-medium text-gray-500">/ night</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-50">
                 <InteractiveMap address={hotel.address} type="HOTEL" /> 
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Booking Sidebar (Desktop Only) */}
          <div className="hidden lg:block w-1/3 relative">
            <div className="sticky top-28 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
              
              <div className="mb-6 flex flex-col items-start border-b border-gray-200 pb-6">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-gray-900">
                    ₦{totalPrice.toLocaleString()}
                  </span>
                  <span className="text-gray-500 font-medium">total</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-700 mt-2 bg-green-50 px-2 py-1 rounded-md">
                  Taxes & fees included
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 space-y-3">
                <div className="flex items-start text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary mr-2 mt-0.5 shrink-0" />
                  <span>Room: <strong>{activeRoomData?.name}</strong></span>
                </div>
                <div className="flex items-start text-sm text-gray-700">
                  <CalendarDays className="w-4 h-4 text-gray-500 mr-2 mt-0.5 shrink-0" />
                  <span>Duration: <strong>{nights} {nights === 1 ? 'night' : 'nights'}</strong></span>
                </div>
                <div className="flex items-start text-sm text-gray-700">
                  <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5 shrink-0" />
                  <span>You won't be charged yet.</span>
                </div>
              </div>

              <button 
                onClick={handleBookClick}
                className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-black transition-colors shadow-md hover:shadow-xl active:scale-[0.98]"
              >
                {isLoggedIn ? "Reserve Now" : "Login to Reserve"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE BOTTOM BOOKING BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[60] flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest bg-green-50 px-1.5 py-0.5 rounded self-start mb-1">Taxes incl.</span>
          <span className="text-xl font-black text-gray-900">₦{totalPrice.toLocaleString()}<span className="text-xs font-medium text-gray-500 ml-1">total</span></span>
        </div>
        <button 
          onClick={handleBookClick}
          className="bg-gray-900 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-black transition-colors shadow-md active:scale-95"
        >
          {isLoggedIn ? "Reserve" : "Login"}
        </button>
      </div>

      {/* PREMIUM TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-28 lg:bottom-10 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="bg-gray-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-gray-700/50">
            <AlertCircle className="w-5 h-5 text-brand-primary shrink-0" />
            <span className="font-medium text-sm tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>

      {hotel && activeRoomData && (
        <BookModal 
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          roomData={activeRoomData}
          hotelData={hotel}
          checkIn={checkInDate}
          checkOut={checkOutDate}
          isLoggedIn={isLoggedIn}
        />
      )}
    </main>
  );
}
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Users, Settings2, Gauge, ChevronLeft, ChevronRight, 
  Loader2, ShieldCheck, Calendar as CalendarIcon, Clock, 
  CreditCard, CheckCircle2, User, Sparkles
} from 'lucide-react';
import { getCarById } from '../api/car';
import { useAuth } from '../context/AuthContext';

export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Gallery Scroll Ref (Mobile)
  const mobileScrollRef = useRef(null);
  const desktopScrollRef = useRef(null);

  // Booking State
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [durationSlots, setDurationSlots] = useState(1); // 1 slot = 12 hours
  const [needsChauffeur, setNeedsChauffeur] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    async function fetchCar() {
      try {
        const data = await getCarById(id);
        setCar(data.data?.car || data.car || data);
      } catch (err) {
        console.error("Failed to load car details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCar();
  }, [id]);

  const scrollGallery = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -ref.current.offsetWidth : ref.current.offsetWidth;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // --- PRICING ENGINE ---
  const pricing = useMemo(() => {
    if (!car) return null;
    
    const baseRate = car.pricePer12Hours || 0;
    const chauffeurRate = needsChauffeur ? 25000 * durationSlots : 0; // 25k per 12 hours for driver
    
    const rentalTotal = baseRate * durationSlots;
    const subtotal = rentalTotal + chauffeurRate;
    const platformFee = Math.round(subtotal * 0.05); // 5% Escrow
    const grandTotal = subtotal + platformFee;

    return { baseRate, rentalTotal, chauffeurRate, subtotal, platformFee, grandTotal };
  }, [car, durationSlots, needsChauffeur]);

  const handleReservation = async (e) => {
    e.preventDefault();
    setBookingError('');

    // 1. Authentication Gate
    if (!user) {
      setBookingError('Please log in or sign up to reserve this vehicle.');
      // Optional: You could trigger an Auth Modal here if you have a global state for it
      return;
    }

    if (!pickupDate) {
      setBookingError('Please select a pick-up date.');
      return;
    }

    setBookingLoading(true);

    try {
      // Simulate API call to your booking endpoint
      // const response = await initiateCarBooking({ carId: car._id, pickupDate, pickupTime, durationSlots, needsChauffeur, total: pricing.grandTotal });
      
      setTimeout(() => {
        setBookingLoading(false);
        alert(`Reservation initiated for ${car.make} ${car.model}. Proceeding to Paystack...`);
        // window.location.href = response.checkoutUrl;
      }, 1500);

    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to initiate reservation.');
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
        <p className="font-medium">Preparing vehicle details...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900">Vehicle not found</h2>
      </div>
    );
  }

  const images = car.images?.length > 0 ? car.images : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-xs font-bold tracking-widest text-brand-primary uppercase mb-2">
          <span>{car.category || 'Premium Vehicle'}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-500 flex items-center"><MapPin className="w-3 h-3 mr-1"/> {car.location?.city}, {car.location?.state}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          {car.make} {car.model} <span className="text-gray-400 font-medium ml-2">{car.year}</span>
        </h1>
      </div>

      {/* --- GALLERY SECTION --- */}
      <div className="relative mb-12">
        
        {/* MOBILE GALLERY */}
        <div className="md:hidden relative h-[300px] rounded-2xl overflow-hidden group">
          <div 
            ref={mobileScrollRef}
            className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {images.map((img, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                <img src={img} className="absolute inset-0 w-full h-full object-cover" alt={`View ${idx + 1}`} />
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <>
              <button onClick={() => scrollGallery(mobileScrollRef, 'left')} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-md z-10"><ChevronLeft className="w-5 h-5"/></button>
              <button onClick={() => scrollGallery(mobileScrollRef, 'right')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-md z-10"><ChevronRight className="w-5 h-5"/></button>
              <div className="absolute bottom-3 right-3 bg-gray-900/80 text-white text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none backdrop-blur-md">
                Swipe for more
              </div>
            </>
          )}
        </div>

        {/* DESKTOP GALLERY (Surgical Grid Fix) */}
        <div className="hidden md:block h-[500px] rounded-2xl overflow-hidden">
          {images.length === 1 && (
            <div className="w-full h-full relative">
              <img src={images[0]} className="absolute inset-0 w-full h-full object-cover rounded-2xl" alt="Main View" />
            </div>
          )}
          {images.length === 2 && (
            <div className="grid grid-cols-2 gap-2 h-full">
              <div className="w-full h-full relative"><img src={images[0]} className="absolute inset-0 w-full h-full object-cover" alt="View 1"/></div>
              <div className="w-full h-full relative"><img src={images[1]} className="absolute inset-0 w-full h-full object-cover" alt="View 2"/></div>
            </div>
          )}
          {images.length >= 3 && (
            <div className="grid grid-cols-2 gap-2 h-full">
              <div className="w-full h-full relative group">
                <img src={images[0]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt="Main View" />
              </div>
              <div className="grid grid-rows-2 gap-2 h-full">
                <div className="w-full h-full relative group">
                  <img src={images[1]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt="View 2" />
                </div>
                <div className="w-full h-full relative group">
                  <div ref={desktopScrollRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                    {images.slice(2).map((img, idx) => (
                      <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                        <img src={img} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt={`View ${idx + 3}`} />
                      </div>
                    ))}
                  </div>
                  {images.length > 3 && (
                    <>
                      <button onClick={() => scrollGallery(desktopScrollRef, 'left')} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={() => scrollGallery(desktopScrollRef, 'right')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200"><ChevronRight className="w-5 h-5" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CONTENT & BOOKING GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEFT COLUMN: Vehicle Details */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Top Specs Bar */}
          <div className="flex flex-wrap gap-4 pb-8 border-b border-gray-200">
            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
              <Users className="w-5 h-5 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seats</span>
                <span className="text-sm font-semibold text-gray-900">{car.seats || 4} Passengers</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
              <Settings2 className="w-5 h-5 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transmission</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{car.transmission || 'Automatic'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
              <Gauge className="w-5 h-5 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{car.category || 'Luxury'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">About this vehicle</h3>
            <p className="text-gray-600 leading-relaxed">
              Experience the perfect blend of performance, prestige, and comfort with this meticulously maintained {car.year} {car.make} {car.model}. 
              Whether you are attending a high-profile corporate event, a VIP wedding, or simply desire a premium driving experience across {car.location?.city}, 
              this vehicle delivers uncompromising luxury. Fully serviced, immaculately detailed, and available with optional professional chauffeur service.
            </p>
          </div>

          {/* Premium Amenities List */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Features & Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
              {['Premium Leather Interior', 'Advanced Climate Control', 'Bluetooth / CarPlay', 'Tinted Privacy Glass', 'GPS Navigation', 'Push-Button Start'].map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-700 font-medium text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Concierge Booking Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] sticky top-28">
            
            <div className="flex items-baseline space-x-1 mb-6 pb-6 border-b border-gray-100">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                ₦{Number(car.pricePer12Hours).toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm font-medium">/ 12 hours</span>
            </div>

            {bookingError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-start">
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleReservation} className="space-y-4">
              
              {/* Timing Grid */}
              <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white">
                <div className="flex border-b border-gray-300">
                  <div className="flex-1 p-3 border-r border-gray-300 relative">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block flex items-center"><CalendarIcon className="w-3 h-3 mr-1"/> Date</label>
                    <input 
                      type="date" 
                      required
                      min={today}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full text-sm outline-none bg-transparent font-semibold mt-1 cursor-pointer text-gray-900"
                    />
                  </div>
                  <div className="flex-1 p-3 relative">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block flex items-center"><Clock className="w-3 h-3 mr-1"/> Time</label>
                    <input 
                      type="time" 
                      required
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full text-sm outline-none bg-transparent font-semibold mt-1 cursor-pointer text-gray-900"
                    />
                  </div>
                </div>
                
                {/* Duration Dropdown */}
                <div className="p-3 bg-gray-50/50">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block mb-1">Rental Duration</label>
                  <select 
                    value={durationSlots}
                    onChange={(e) => setDurationSlots(Number(e.target.value))}
                    className="w-full text-sm outline-none bg-transparent font-semibold cursor-pointer text-brand-primary"
                  >
                    <option value={1}>12 Hours (Half Day)</option>
                    <option value={2}>24 Hours (Full Day)</option>
                    <option value={4}>48 Hours (2 Days)</option>
                    <option value={6}>72 Hours (3 Days)</option>
                    <option value={14}>1 Week (14 x 12hr blocks)</option>
                  </select>
                </div>
              </div>

              {/* Chauffeur Toggle */}
              <div 
                onClick={() => setNeedsChauffeur(!needsChauffeur)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  needsChauffeur ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${needsChauffeur ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${needsChauffeur ? 'text-brand-dark' : 'text-gray-700'}`}>Add Chauffeur</div>
                    <div className="text-xs text-gray-500 font-medium">₦25,000 / 12 hours</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${needsChauffeur ? 'border-brand-primary' : 'border-gray-300'}`}>
                  {needsChauffeur && <div className="w-2.5 h-2.5 bg-brand-primary rounded-full"></div>}
                </div>
              </div>

              {/* Dynamic Action Button */}
              <button 
                type="submit"
                disabled={bookingLoading}
                className="w-full py-4 mt-2 bg-gray-900 hover:bg-brand-primary text-white rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 duration-200"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Processing...</span>
                  </>
                ) : !user ? (
                  'Log in to Reserve'
                ) : (
                  'Reserve Vehicle'
                )}
              </button>
            </form>

            <div className="flex items-center justify-center space-x-2 text-gray-500 mt-5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold tracking-wide">Platform Escrow Protection</span>
            </div>

            {/* Live Receipt Breakdown */}
            {pricing && (
              <div className="space-y-3 pt-6 mt-6 border-t border-gray-100">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span className="underline decoration-gray-300 underline-offset-4">
                    ₦{pricing.baseRate.toLocaleString()} x {durationSlots} slots (12hr)
                  </span>
                  <span className="font-medium text-gray-900">₦{pricing.rentalTotal.toLocaleString()}</span>
                </div>
                
                {needsChauffeur && (
                  <div className="flex justify-between text-gray-600 text-sm animate-in slide-in-from-top-1 duration-200">
                    <span className="underline decoration-gray-300 underline-offset-4 flex items-center"><Sparkles className="w-3 h-3 mr-1 text-amber-500"/> Chauffeur Fee</span>
                    <span className="font-medium text-gray-900">₦{pricing.chauffeurRate.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600 text-sm">
                  <span className="underline decoration-gray-300 underline-offset-4">Platform Escrow Fee</span>
                  <span className="font-medium text-gray-900">₦{pricing.platformFee.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between font-extrabold text-gray-900 text-lg pt-4 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>₦{pricing.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
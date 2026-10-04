import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; 
import { 
  MapPin, Users, Settings2, Gauge, ChevronLeft, ChevronRight, Clock, Info,
  Loader2, ShieldCheck, Calendar as CalendarIcon, 
  CreditCard, CheckCircle2, User, Sparkles, XCircle, CalendarSearch
} from 'lucide-react';
import { getCarById, createCarReservation, checkCarAvailability, getCars } from '../api/car'; 
import { useAuth } from '../context/AuthContext';

export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 1. Pulled setShowAuthModal to trigger the global login popup
  const { user, setShowAuthModal } = useAuth();
  
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarCars, setSimilarCars] = useState([]);

  const mobileScrollRef = useRef(null);
  const desktopScrollRef = useRef(null);

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [durationSlots, setDurationSlots] = useState(1); 
  const [needsChauffeur, setNeedsChauffeur] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null); 

  useEffect(() => {
    setAvailabilityStatus(null);
    setBookingError('');
  }, [pickupDate, pickupTime, durationSlots]);

  const generateNext14Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const CONCIERGE_TIME_SLOTS = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  const [availableDates] = useState(generateNext14Days());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchCar() {
      try {
        setLoading(true);
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

  useEffect(() => {
    async function fetchSimilar() {
      if (!car?.location?.city) return;
      try {
        const res = await getCars(); 
        const allCars = res?.data?.cars || res?.cars || res?.data || [];
        
        const similar = allCars.filter(c => 
          (c._id || c.id) !== (car._id || car.id) && 
          c.location?.city === car.location?.city
        ).slice(0, 4); 
        
        setSimilarCars(similar);
      } catch (err) {
        console.error("Failed to load similar cars", err);
      }
    }
    
    if (car) fetchSimilar();
  }, [car]);

  const scrollGallery = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -ref.current.offsetWidth : ref.current.offsetWidth;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const pricing = useMemo(() => {
    if (!car) return null;
    
    const baseRate = car.pricePer12Hours || 0;
    const chauffeurRate = needsChauffeur ? 25000 * durationSlots : 0; 
    
    const rentalTotal = baseRate * durationSlots;
    const subtotal = rentalTotal + chauffeurRate;
    const platformFee = Math.round(subtotal * 0.05); 
    const grandTotal = subtotal + platformFee;

    return { baseRate, rentalTotal, chauffeurRate, subtotal, platformFee, grandTotal };
  }, [car, durationSlots, needsChauffeur]);

  const handleCheckAvailability = async () => {
    if (!pickupDate || !pickupTime) {
      setBookingError('Please select a pick-up date and time first.');
      return;
    }
    
    setIsCheckingAvailability(true);
    setBookingError('');
    
    try {
      const pickupDateTime = new Date(`${pickupDate} ${pickupTime}`);
      const dropoffDateTime = new Date(pickupDateTime);
      dropoffDateTime.setHours(pickupDateTime.getHours() + (durationSlots * 12)); 

      const response = await checkCarAvailability(car._id || car.id, { 
        startDate: pickupDateTime.toISOString(), 
        endDate: dropoffDateTime.toISOString() 
      });
      
      if (response.available) {
        setAvailabilityStatus('available');
      } else {
        setAvailabilityStatus('booked');
        if (response.message) setBookingError(response.message);
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to verify availability. Please try again.');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!user) {
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }

    if (!pickupDate) {
      setBookingError('Please select a pick-up date.');
      return;
    }

    if (availabilityStatus === 'booked') {
      setBookingError('These dates are already booked. Please choose different times.');
      return;
    }

    setBookingLoading(true);

    try {
      const pickupDateTime = new Date(`${pickupDate} ${pickupTime}`);
      const dropoffDateTime = new Date(pickupDateTime);
      dropoffDateTime.setHours(pickupDateTime.getHours() + (durationSlots * 12)); 

      const payload = {
        carId: car._id || car.id,
        pickupTime: pickupDateTime.toISOString(),
        dropoffTime: dropoffDateTime.toISOString(),
        totalAmount: pricing.grandTotal
      };

      const response = await createCarReservation(payload);
      
      setBookingLoading(false);
      setIsRedirecting(true);

      setTimeout(() => {
        window.location.href = response.data.checkoutUrl; 
      }, 800);

    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Failed to initiate reservation.');
      setBookingLoading(false);
      setIsRedirecting(false);
    }
  };

  // 2. The perfectly locked-down WhatsApp Concierge Handler
  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    
    if (!user) {
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }

    if (user.role !== 'USER') {
      setBookingError('Only guest accounts can make reservations.');
      return;
    }

    const WHATSAPP_NUMBER = "2348000000000"; // Replace with actual Rentals Africa number
    
    const waMessage = encodeURIComponent(
      `Hi Rentals Africa, I am ${user.firstName}, a verified guest. I am interested in booking:\n\n` +
      `🚘 Vehicle: ${car.make} ${car.model} ${car.year}\n` +
      `📍 Location: ${car.location?.city || 'Not specified'}\n` +
      `📅 Pickup: ${pickupDate || '(Not selected)'} at ${pickupTime}\n` +
      `⏱ Duration: ${durationSlots * 12} hours\n` +
      `👨‍✈️ Chauffeur: ${needsChauffeur ? 'Yes' : 'No'}\n\n` +
      `Could you please assist me with this reservation?`
    );

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`, '_blank');
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6 group w-fit"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>
      
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
          <div ref={mobileScrollRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
            </>
          )}
        </div>

        {/* DESKTOP GALLERY */}
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
          <div className="flex flex-wrap gap-4 pb-8 border-b border-gray-200">
            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
              <Users className="w-5 h-5 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seats</span>
                <span className="text-sm font-semibold text-gray-900">{car.seatNumber || 4} Passengers</span>
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

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">About this vehicle</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {car.description || "A premium, meticulously maintained vehicle ready for your travel needs."}
            </p>
          </div>

          {car.features && car.features.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Features & Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
                {car.features.map((feature, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-gray-700 font-medium text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Concierge Booking Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 p-5 lg:p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] sticky top-28">
            
            <div className="flex items-baseline space-x-1 mb-5 pb-5 border-b border-gray-100">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                ₦{Number(car.pricePer12Hours).toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm font-medium">/ day</span>
            </div>

            {bookingError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-start">
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleReservation} className="space-y-3">
              
              <div className="space-y-5 p-4 lg:p-5 border border-gray-100 rounded-2xl bg-gray-50/50 shadow-sm">
                
                {/* COMPACT Date Selector */}
                <div>
                  <div className="flex items-center space-x-2 mb-2.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Pickup Date</label>
                  </div>
                  <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x">
                    {availableDates.map((date, index) => {
                      const dateString = date.toISOString().split('T')[0];
                      const isSelected = pickupDate === dateString;
                      return (
                        <button
                          key={dateString}
                          type="button"
                          onClick={() => setPickupDate(dateString)}
                          className={`snap-start shrink-0 flex flex-col items-center justify-center w-14 h-[72px] rounded-xl transition-all duration-300 border ${
                            isSelected ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'
                          }`}
                        >
                          <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                            {index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="text-xl font-extrabold tracking-tight">{date.getDate()}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                            {date.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full h-px bg-gray-200/60"></div>

                {/* COMPACT Time Selector */}
                <div>
                  <div className="flex items-center space-x-2 mb-2.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Pickup Time</label>
                  </div>
                  <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x">
                    {CONCIERGE_TIME_SLOTS.map((time) => {
                      const isSelected = pickupTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setPickupTime(time)}
                          className={`snap-start shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                            isSelected ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COMPACT Duration Dropdown */}
                <div className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <label className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500 block mb-0.5">Rental Duration</label>
                  <select 
                    value={durationSlots}
                    onChange={(e) => setDurationSlots(Number(e.target.value))}
                    className="w-full text-sm outline-none bg-transparent font-bold cursor-pointer text-gray-900"
                  >
                    <option value={1}>12 Hours (Half Day)</option>
                    <option value={2}>24 Hours (Full Day)</option>
                    <option value={4}>48 Hours (2 Days)</option>
                    <option value={6}>72 Hours (3 Days)</option>
                    <option value={14}>1 Week (14 x 12hr blocks)</option>
                  </select>
                </div>
              </div>

              {/* COMPACT Chauffeur Toggle */}
              <div 
                onClick={() => setNeedsChauffeur(!needsChauffeur)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  needsChauffeur ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${needsChauffeur ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${needsChauffeur ? 'text-brand-dark' : 'text-gray-700'}`}>Add Chauffeur</div>
                    <div className="text-xs text-gray-500 font-medium">₦25,000 / day</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${needsChauffeur ? 'border-brand-primary' : 'border-gray-300'}`}>
                  {needsChauffeur && <div className="w-2 h-2 bg-brand-primary rounded-full"></div>}
                </div>
              </div>

              {/* Availability Status Indicator */}
              {availabilityStatus === 'available' && (
                <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold">Vehicle is available!</span>
                </div>
              )}
              {availabilityStatus === 'booked' && (
                <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 mt-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold">Time slot is already booked.</span>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-2.5 pt-2">
                <div className="flex gap-2.5">
                  <button 
                    type="button"
                    onClick={handleCheckAvailability}
                    disabled={isCheckingAvailability}
                    className="w-1/2 py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900 rounded-xl font-bold text-sm transition-all flex items-center justify-center shadow-sm disabled:opacity-70 active:scale-95 duration-200"
                  >
                    {isCheckingAvailability ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CalendarSearch className="w-3.5 h-3.5 mr-1.5" />
                        Availability
                      </>
                    )}
                  </button>

                  <button 
                    type="submit"
                    disabled={bookingLoading || isRedirecting || availabilityStatus === 'booked'}
                    className="w-1/2 py-3 bg-gray-900 hover:bg-brand-primary text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 duration-200"
                  >
                    {bookingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isRedirecting ? (
                      <ShieldCheck className="w-4 h-4 animate-pulse" />
                    ) : (
                      'Reserve Now'
                    )}
                  </button>
                </div>

                {/* 3. Replaced <a> tag with <button> to execute lockdown logic */}
                <button 
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center active:scale-95 duration-200"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Book via WhatsApp
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center space-x-1.5 text-gray-500 mt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Platform Escrow Protection</span>
            </div>

            {/* COMPACT Live Receipt Breakdown */}
            {pricing && (
              <div className="space-y-2 pt-5 mt-5 border-t border-gray-100">
                <div className="flex justify-between text-gray-600 text-xs">
                  <span className="underline decoration-gray-300 underline-offset-4">
                    ₦{pricing.baseRate.toLocaleString()} x {durationSlots} slots
                  </span>
                  <span className="font-bold text-gray-900">₦{pricing.rentalTotal.toLocaleString()}</span>
                </div>
                
                {needsChauffeur && (
                  <div className="flex justify-between text-gray-600 text-xs animate-in slide-in-from-top-1 duration-200">
                    <span className="underline decoration-gray-300 underline-offset-4 flex items-center"> Chauffeur Fee</span>
                    <span className="font-bold text-gray-900">₦{pricing.chauffeurRate.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600 text-xs">
                  <span className="underline decoration-gray-300 underline-offset-4">Platform Escrow Fee</span>
                  <span className="font-bold text-gray-900">₦{pricing.platformFee.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between font-extrabold text-gray-900 text-base pt-3 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>₦{pricing.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- NEW: SIMILAR CARS SECTION --- */}
      {similarCars.length > 0 && (
        <div className="mt-12 pt-16 border-t border-gray-100">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">More luxury vehicles</h3>
              <p className="text-gray-500 font-medium mt-1">Similar premium cars available in {car.location?.city}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarCars.map((simCar) => (
              <Link 
                key={simCar._id || simCar.id} 
                to={`/cars/${simCar._id || simCar.id}`}
                className="group flex flex-col cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                  <img 
                    src={simCar.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'} 
                    alt={`${simCar.make} ${simCar.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-900 uppercase tracking-wider">
                    {simCar.category || 'Luxury'}
                  </div>
                </div>
                
                <div className="p-5">
                  <h4 className="font-bold text-gray-900 text-base truncate mb-1 group-hover:text-brand-primary transition-colors">
                    {simCar.make} {simCar.model}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {simCar.location?.city}
                  </p>
                  <div className="flex items-baseline space-x-1 pt-3 border-t border-gray-100">
                    <span className="font-extrabold text-gray-900 text-lg">₦{(simCar.pricePer12Hours || 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-500 font-medium">/ day</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
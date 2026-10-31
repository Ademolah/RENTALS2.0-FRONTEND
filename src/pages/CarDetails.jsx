import { useState, useEffect, useMemo, useRef } from 'react';
import { WhatsAppCheckout, WhatsAppPill } from '../components/ui';
import { toLocalISO } from '../lib/dates';
import { useParams, useNavigate, Link } from 'react-router-dom'; 
import { MapPin, Users, Settings2, Gauge, ChevronLeft, ChevronRight, Clock, Loader2, ShieldCheck, Calendar as CalendarIcon, CheckCircle2, User, CalendarSearch, X, Video, Truck } from 'lucide-react';
import { getCarById, checkCarAvailability, getCars } from '../api/car';
import { useAuth } from '../context/AuthContext';
import { logUnifiedWhatsappIntent, saveCheckoutDraft } from '../api/reservation';
import AvailabilityNotice from '../components/AvailabilityNotice';
import ShareButton from '../components/ShareButton';
import { useDocumentMeta } from '../lib/seo';
import { CONCIERGE_WHATSAPP } from '../lib/config';
import { addDays, isDayBooked } from '../lib/availability';

const to24 = (t) => {
  const m = /(\d+):(\d+)\s*(AM|PM)?/i.exec(t || '10:00 AM') || ['', '10', '00'];
  let h = Number(m[1]);
  if (m[3]) {
    const pm = m[3].toUpperCase() === 'PM';
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};
const slotRange = (date, time, slots) => {
  const start = new Date(`${date}T${to24(time)}:00+01:00`);
  return { start, end: new Date(start.getTime() + slots * 12 * 3600000) };
};
const lagosIso = (d) => new Date(d.getTime() + 3600000).toISOString().slice(0, 19) + '+01:00';


export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { user, setShowAuthModal } = useAuth();
  
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarCars, setSimilarCars] = useState([]);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);

  const mobileScrollRef = useRef(null);
  const desktopScrollRef = useRef(null);

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [durationSlots, setDurationSlots] = useState(1); 
  const [needsChauffeur, setNeedsChauffeur] = useState(false);
  const [licenseAck, setLicenseAck] = useState(false);
  const [needsDelivery, setNeedsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isRedirecting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null); 

  // --- CUSTOM CALENDAR STATE ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // --- LIGHTBOX STATE ---
  const [lightboxIndex, setLightboxIndex] = useState(null);

  

  useEffect(() => {
    setAvailabilityStatus(null);
    setBookingError('');
  }, [pickupDate, pickupTime, durationSlots]);

  const CONCIERGE_TIME_SLOTS = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  // --- CALENDAR LOGIC ---
  const todayDateObj = new Date();
  todayDateObj.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const generateCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return days;
  };

  const handleDateSelect = (dateObj) => {
    const offsetDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
    setPickupDate(offsetDate.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  const nextMonth = (e) => { e.preventDefault(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)); };
  const prevMonth = (e) => { e.preventDefault(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)); };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchCar() {
      try {
        setLoading(true);
        const data = await getCarById(id);
        setCar(data.data?.car || data.car || data);
      } catch {
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

  useDocumentMeta(car ? `${car.make} ${car.carModel || car.model || ''} ${car.year || ''}`.trim() : '', car?.description?.slice(0, 160));
  const chauffeurIncluded = /chauffeur/i.test(String(car?.category || '').replace(/_/g, ' '));

  const pricing = useMemo(() => {
    if (!car) return null;
    
    const baseRate = car.pricePer12Hours || 0;
    const chauffeurRate = needsChauffeur && !chauffeurIncluded ? 25000 * durationSlots : 0;
    
    const deliveryRate = needsDelivery && car.deliveryAvailable ? Number(car.deliveryFee || 0) : 0;
    const rentalTotal = baseRate * durationSlots;
    const subtotal = rentalTotal + chauffeurRate + deliveryRate;
    const platformFee = 0;
    const grandTotal = subtotal + platformFee;

    return { baseRate, rentalTotal, chauffeurRate, deliveryRate, subtotal, platformFee, grandTotal };
  }, [car, durationSlots, needsChauffeur, chauffeurIncluded, needsDelivery]);

  // 💡 FIX: Safely derive images BEFORE the early returns so hooks never change order
  const images = car?.images?.length > 0 ? car.images : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80'];

  // 💡 FIX: Moved Keyboard Navigation useEffect safely ABOVE the early returns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, images.length]);

  // Button Handlers for UI
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const scrollGallery = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -ref.current.offsetWidth : ref.current.offsetWidth;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCheckAvailability = async () => {
    if (!pickupDate || !pickupTime) {
      setBookingError('Please select a pick-up date and time first.');
      return false;
    }
    
    setIsCheckingAvailability(true);
    setBookingError('');
    
    try {
      const { start: pickupDateTime, end: dropoffDateTime } = slotRange(pickupDate, pickupTime, durationSlots);

      const response = await checkCarAvailability(car._id || car.id, { 
        startDate: lagosIso(pickupDateTime), 
        endDate: lagosIso(dropoffDateTime) 
      });
      
      if (response.available) {
        setAvailabilityStatus('available');
        return true;
      } else {
        setAvailabilityStatus('booked');
        if (response.message) setBookingError(response.message);
        return false;
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to verify availability. Please try again.');
      return false;
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

    if (!licenseAck) {
      setBookingError('Please confirm you hold a valid driving licence.');
      return;
    }

    if (needsDelivery && car.deliveryAvailable && deliveryAddress.trim().length < 4) {
      setBookingError('Please enter the address where we should deliver the car.');
      return;
    }

    if (availabilityStatus === 'booked') {
      setBookingError('These dates have been booked.');
      return;
    }

    setBookingLoading(true);

    if (availabilityStatus !== 'available') {
      const isAvailable = await handleCheckAvailability();
      if (!isAvailable) {
        setBookingLoading(false);
        return;
      }
    }

    const { start: pickupDateTime, end: dropoffDateTime } = slotRange(pickupDate, pickupTime, durationSlots);
    const fmt = (d) => d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
    const lines = [{ label: `₦${pricing.baseRate.toLocaleString()} x ${durationSlots} x 12 hrs`, amount: pricing.rentalTotal }];
    if (pricing.chauffeurRate) lines.push({ label: 'Chauffeur', amount: pricing.chauffeurRate });
    if (pricing.deliveryRate) lines.push({ label: 'Delivery', amount: pricing.deliveryRate });
    const details = [
      { label: 'Pick-up', value: fmt(pickupDateTime) },
      { label: 'Return', value: fmt(dropoffDateTime) },
      { label: 'Duration', value: `${durationSlots * 12} hours` },
      { label: 'Chauffeur', value: chauffeurIncluded ? 'Included' : needsChauffeur ? 'Yes' : 'No' },
    ];
    if (needsDelivery && car.deliveryAvailable) details.push({ label: 'Delivery address', value: deliveryAddress.trim() });

    saveCheckoutDraft({
      kind: 'car',
      tag: car.category || 'Car rental',
      title: `${car.make} ${car.carModel || car.model || ''} ${car.year || ''}`.trim(),
      subtitle: [car.location?.city, car.location?.state].filter(Boolean).join(', '),
      image: images[0],
      backTo: `/cars/${car._id || car.id}`,
      details,
      lines,
      total: pricing.grandTotal,
      payload: {
        carId: car._id || car.id,
        pickupTime: lagosIso(pickupDateTime),
        dropoffTime: lagosIso(dropoffDateTime),
        totalAmount: pricing.grandTotal,
        withChauffeur: needsChauffeur && !chauffeurIncluded,
        licenseAck: true,
      },
    });
    setBookingLoading(false);
    navigate('/checkout');
  };

 const handleWhatsAppClick = async (e) => {
    e.preventDefault();
    
    if (!pickupDate || !pickupTime) {
      setBookingError('Please select your pickup date and time before contacting the concierge.');
      setShowCalendar(true);
      return;
    }

    if (!user) {
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }

    if (user.role !== 'USER') {
      setBookingError('Only guest accounts can make reservations.');
      return;
    }

    setIsWhatsappLoading(true);
    setBookingError('');

    try {
      // Calculate precise drop-off based on selected duration slots (12 hours per slot)
      const { start: pickupDateTime, end: dropoffDateTime } = slotRange(pickupDate, pickupTime, durationSlots);

      // 1. Fire intent to database
      const response = await logUnifiedWhatsappIntent({
        assetId: car._id || car.id,
        assetType: 'CAR',
        startDate: lagosIso(pickupDateTime),
        endDate: lagosIso(dropoffDateTime),
        extraData: { withDriver: needsChauffeur && !chauffeurIncluded }
      });

      // 2. Retrieve secure reference
      const reference = response.data?.data?.reference || response.data?.reference;
      if (!reference) throw new Error('No reference');

      // 3. Inject reference into the message
      const WHATSAPP_NUMBER = CONCIERGE_WHATSAPP;
      
      const waMessage = encodeURIComponent(
        `Hi Rentals Africa, I am ${user.firstName}, a verified guest. I am interested in booking:\n\n` +
        `🚘 Vehicle: ${car.make} ${car.carModel} ${car.year}\n` +
        `📍 Location: ${car.location?.city || 'Not specified'}\n` +
        `📅 Pickup: ${pickupDate} at ${pickupTime}\n` +
        `⏱ Duration: ${durationSlots * 12} hours\n` +
        `👨‍✈️ Chauffeur: ${needsChauffeur ? 'Yes' : 'No'}\n` +
        (needsDelivery && car.deliveryAvailable ? `🚚 Delivery to: ${deliveryAddress.trim() || 'to be confirmed'}\n` : '') +
        `🔒 Reference: ${reference}\n\n` +
        `Could you please assist me with this reservation?`
      );

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setBookingError("Failed to initialize secure chat. Please try again.");
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  // --- EARLY RETURNS (MUST BE AFTER ALL HOOKS) ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-brand-text-muted">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
        <p className="font-medium">Preparing vehicle details...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-brand-dark">Vehicle not found</h2>
      </div>
    );
  }

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 relative">

      {/* FULL SCREEN LIGHTBOX */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
            <div className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }} 
              className="text-white hover:bg-white/20 bg-white/10 rounded-full p-2.5 transition-colors"
             aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative w-full max-w-7xl px-4 flex items-center justify-center">
            {images.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                className="absolute left-4 md:left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
               aria-label="Previous">
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img 
              src={images[lightboxIndex]} 
              alt="Expanded view" 
              className="max-h-[85vh] max-w-full object-contain select-none rounded-xl shadow-elevated" 
              onClick={(e) => e.stopPropagation()} 
            />

            {images.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }} 
                className="absolute right-4 md:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
               aria-label="Next">
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-base font-semibold text-brand-text-secondary hover:text-brand-dark transition-colors mb-6 group w-fit"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>
      
      {/* HEADER SECTION */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm font-bold tracking-widest text-brand-primary uppercase mb-3">
          <span>{car.category || 'Premium Vehicle'}</span>
          <span className="text-gray-300">|</span>
          <span className="text-brand-text-secondary flex items-center"><MapPin className="w-4 h-4 mr-1"/> {car.location?.city}, {car.location?.state}</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold text-brand-dark tracking-tight leading-[1.05]">
          {car.make} {car.model} <span className="text-brand-text-muted font-medium ml-2">{car.year}</span>
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3"><ShareButton /><WhatsAppPill /></div>
        <p className="mt-3 text-base font-medium text-brand-text-secondary">Managed by Rentals Africa</p>
      </div>

      {/* --- GALLERY SECTION --- */}
      <div className="relative mb-12">
        {/* MOBILE GALLERY */}
        <div className="md:hidden relative h-[300px] rounded-3xl overflow-hidden group">
          <div ref={mobileScrollRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {images.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setLightboxIndex(idx)}
                className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer"
              >
                <img src={img} className="absolute inset-0 w-full h-full object-cover" alt={`View ${idx + 1}`} />
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <>
              <button onClick={() => scrollGallery(mobileScrollRef, 'left')} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-md z-10" aria-label="Previous"><ChevronLeft className="w-5 h-5"/></button>
              <button onClick={() => scrollGallery(mobileScrollRef, 'right')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-md z-10" aria-label="Next"><ChevronRight className="w-5 h-5"/></button>
            </>
          )}
        </div>

        {/* DESKTOP GALLERY */}
        <div className="hidden md:block h-[540px] rounded-3xl overflow-hidden">
          {images.length === 1 && (
            <div 
              className="w-full h-full relative cursor-pointer"
              onClick={() => setLightboxIndex(0)}
            >
              <img src={images[0]} className="absolute inset-0 w-full h-full object-cover rounded-2xl" alt="Main View" />
            </div>
          )}
          {images.length === 2 && (
            <div className="grid grid-cols-2 gap-2 h-full">
              <div 
                className="w-full h-full relative cursor-pointer"
                onClick={() => setLightboxIndex(0)}
              >
                <img src={images[0]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt="View 1"/>
              </div>
              <div 
                className="w-full h-full relative cursor-pointer"
                onClick={() => setLightboxIndex(1)}
              >
                <img src={images[1]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt="View 2"/>
              </div>
            </div>
          )}
          {images.length >= 3 && (
            <div className="grid grid-cols-2 gap-2 h-full">
              <div 
                className="w-full h-full relative group cursor-pointer"
                onClick={() => setLightboxIndex(0)}
              >
                <img src={images[0]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt="Main View" />
              </div>
              <div className="grid grid-rows-2 gap-2 h-full">
                <div 
                  className="w-full h-full relative group cursor-pointer"
                  onClick={() => setLightboxIndex(1)}
                >
                  <img src={images[1]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt="View 2" />
                </div>
                <div className="w-full h-full relative group">
                  <div ref={desktopScrollRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                    {images.slice(2).map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setLightboxIndex(idx + 2)}
                        className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer"
                      >
                        <img src={img} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt={`View ${idx + 3}`} />
                      </div>
                    ))}
                  </div>
                  {images.length > 3 && (
                    <>
                      <button onClick={() => scrollGallery(desktopScrollRef, 'left')} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-brand-dark p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={() => scrollGallery(desktopScrollRef, 'right')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-brand-dark p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CONTENT & BOOKING GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        
        {/* LEFT COLUMN: Vehicle Details */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex flex-wrap gap-4 pb-8 border-b border-gray-200">
            <div className="flex items-center space-x-3 bg-brand-accent-soft px-5 py-4 rounded-2xl flex-1 min-w-[190px]">
              <Users className="w-5 h-5 text-brand-text-secondary" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Seats</span>
                <span className="text-lg font-display font-bold text-brand-dark">{car.seatNumber || 4} Passengers</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-brand-accent-soft px-5 py-4 rounded-2xl flex-1 min-w-[190px]">
              <Settings2 className="w-5 h-5 text-brand-text-secondary" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Transmission</span>
                <span className="text-lg font-display font-bold text-brand-dark capitalize">{car.transmission || 'Automatic'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-brand-accent-soft px-5 py-4 rounded-2xl flex-1 min-w-[190px]">
              <Gauge className="w-5 h-5 text-brand-text-secondary" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Class</span>
                <span className="text-lg font-display font-bold text-brand-dark capitalize">{car.category || 'Luxury'}</span>
              </div>
            </div>
            {car.deliveryAvailable && (
              <div className="flex items-center space-x-3 bg-brand-accent-soft px-5 py-4 rounded-2xl flex-1 min-w-[190px]">
                <Truck className="w-5 h-5 text-brand-text-secondary" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Delivery</span>
                  <span className="text-lg font-display font-bold text-brand-dark">Available · ₦{Number(car.deliveryFee || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-5">About this vehicle</h3>
            <p className="text-brand-text-secondary text-lg leading-8 whitespace-pre-line">
              {car.description || "A premium, meticulously maintained vehicle ready for your travel needs."}
            </p>
          </div>

          {car.features && car.features.length > 0 && (
            <div>
              <h3 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-5">Features & Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
                {car.features.map((feature, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-status-available shrink-0" />
                    <span className="text-brand-dark font-medium text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cinematic Video Tour Section */}
          {car.video && (
            <div className="pt-4 pb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Video className="w-5 h-5 text-brand-dark" />
                <h3 className="text-3xl font-display font-bold text-brand-dark tracking-tight">Cinematic Tour</h3>
              </div>
              <div className="w-full relative rounded-2xl overflow-hidden bg-black shadow-lg group">
                <video 
                  src={car.video} 
                  controls 
                  preload="metadata"
                  className="w-full h-auto max-h-[450px] object-contain"
                  poster={images[0]} 
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Concierge Booking Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 p-6 lg:p-7 rounded-3xl shadow-elevated sticky top-28">
            
            {/* REACTIVE TOP PRICE */}
            <div className="flex items-baseline space-x-1 mb-5 pb-5 border-b border-gray-100 transition-all duration-300">
              <span className="text-4xl font-display font-bold text-brand-dark tracking-tight">
                ₦{pricing ? pricing.subtotal.toLocaleString() : Number(car.pricePer12Hours).toLocaleString()}
              </span>
              <span className="text-brand-text-secondary text-base font-medium">
                {pricing && durationSlots > 1 ? '/ total' : '/ 12 hrs'}
              </span>
            </div>

            {bookingError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-start animate-in fade-in">
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleReservation} className="space-y-3">
              
              <div className="space-y-5 p-4 lg:p-5 border border-gray-100 rounded-2xl bg-gray-50/50 shadow-sm relative">
                
                {/* BESPOKE DATE PICKER */}
                <div className="relative">
                  <div className="flex items-center space-x-2 mb-2.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-brand-text-muted" />
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-dark">Pickup Date</label>
                  </div>
                  
                  <div 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`w-full bg-white border rounded-xl py-3.5 pl-4 pr-4 cursor-pointer transition-colors flex items-center justify-between ${showCalendar ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className={pickupDate ? 'text-brand-dark font-bold text-base' : 'text-brand-text-muted font-medium text-base'}>
                      {pickupDate ? new Date(pickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                    </span>
                  </div>

                  {/* Calendar Popover */}
                  {showCalendar && (
                    <div className="absolute top-[70px] left-0 w-full bg-white border border-gray-200 shadow-elevated rounded-2xl p-5 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" aria-label="Previous"><ChevronLeft className="w-4 h-4"/></button>
                        <span className="font-display font-bold text-base tracking-widest uppercase text-brand-dark">
                          {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" aria-label="Next"><ChevronRight className="w-4 h-4"/></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-display font-bold text-brand-text-muted tracking-widest uppercase">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-y-2">
                        {generateCalendarDays().map((dateObj, i) => {
                          if (!dateObj) return <div key={i} className="h-8"></div>;
                          
                          const dateStr = toLocalISO(dateObj);
                          const isPast = dateObj < todayDateObj;
                          const isSelected = dateStr === pickupDate;
                          const isTaken = isDayBooked(car.bookedDates, dateStr);
                          
                          let bgClass = 'hover:bg-gray-100 text-brand-dark';
                          if (isPast) bgClass = 'text-gray-300 cursor-not-allowed';
                          if (isTaken && !isPast) bgClass = 'text-gray-400 line-through cursor-not-allowed bg-gray-50';
                          if (isSelected) bgClass = 'bg-gray-900 text-white shadow-md';

                          return (
                            <button
                              key={i}
                              disabled={isPast || isTaken}
                              onClick={(e) => { e.preventDefault(); handleDateSelect(dateObj); }}
                              className={`h-8 w-8 mx-auto rounded-full text-xs font-bold transition-all flex items-center justify-center ${bgClass}`}
                            >
                              {dateObj.getDate()}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 text-right">
                        <button 
                          onClick={(e) => { e.preventDefault(); setShowCalendar(false); }}
                          className="text-xs font-bold text-brand-dark underline underline-offset-2"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-gray-200/60"></div>

                {/* COMPACT Time Selector */}
                <div>
                  <div className="flex items-center space-x-2 mb-2.5">
                    <Clock className="w-3.5 h-3.5 text-brand-text-muted" />
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-dark">Pickup Time</label>
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
                            isSelected ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]' : 'bg-white border-gray-200 text-brand-text-secondary hover:border-gray-400 hover:text-brand-dark'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COMPACT Duration Dropdown */}
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <label className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-secondary block mb-0.5">Rental Duration</label>
                  <select 
                    value={durationSlots}
                    onChange={(e) => setDurationSlots(Number(e.target.value))}
                    className="w-full text-base outline-none bg-transparent font-bold cursor-pointer text-brand-dark"
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
              {!chauffeurIncluded && (
              <div 
                onClick={() => setNeedsChauffeur(!needsChauffeur)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  needsChauffeur ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${needsChauffeur ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-text-muted'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-base font-bold ${needsChauffeur ? 'text-brand-dark' : 'text-gray-700'}`}>Add Chauffeur</div>
                    <div className="text-xs text-brand-text-secondary font-medium">₦25,000 / 12 hrs</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${needsChauffeur ? 'border-brand-primary' : 'border-gray-300'}`}>
                  {needsChauffeur && <div className="w-2 h-2 bg-brand-primary rounded-full"></div>}
                </div>
              </div>
              )}

              {car.deliveryAvailable && (
                <div className={`p-3.5 rounded-2xl border-2 transition-all ${needsDelivery ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 bg-white'}`}>
                  <div onClick={() => setNeedsDelivery(!needsDelivery)} className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${needsDelivery ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-text-muted'}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-brand-dark">Deliver to me</div>
                        <div className="text-sm text-brand-text-secondary font-medium">₦{Number(car.deliveryFee || 0).toLocaleString()} delivery fee</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${needsDelivery ? 'border-brand-primary' : 'border-gray-300'}`}>
                      {needsDelivery && <div className="w-2 h-2 bg-brand-primary rounded-full"></div>}
                    </div>
                  </div>
                  {needsDelivery && (
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Where should we bring it?"
                      className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-200 text-base text-brand-dark outline-none focus:border-brand-dark" aria-label="Where should we bring it?" />
                  )}
                </div>
              )}

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-100 cursor-pointer">
                <input type="checkbox" checked={licenseAck} onChange={(e) => setLicenseAck(e.target.checked)} className="mt-1 w-5 h-5 accent-brand-primary" />
                <span className="text-sm text-brand-text-secondary leading-relaxed">I hold a valid driving licence and will present it when I collect the vehicle.</span>
              </label>

              {/* Availability Status Indicator */}
              {availabilityStatus === 'available' && (
                <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200 mt-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold">Vehicle is available!</span>
                </div>
              )}
              {availabilityStatus === 'booked' && (
                <div className="mt-2">
                  <AvailabilityNotice
                    start={pickupDate}
                    end={addDays(pickupDate, Math.max(1, Math.ceil(durationSlots / 2)))}
                    isFree={async (d) => {
                      const { start, end } = slotRange(d, pickupTime, durationSlots);
                      return (await checkCarAvailability(car._id || car.id, { startDate: lagosIso(start), endDate: lagosIso(end) })).available !== false;
                    }}
                    onPick={(d) => setPickupDate(d)}
                  />
                </div>
              )}

              <p className="text-sm text-brand-text-secondary leading-relaxed">Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment. Rentals Africa reviews and processes refunds.</p>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-2.5 pt-2">
                <div className="flex gap-2.5">
                  <button 
                    type="button"
                    onClick={handleCheckAvailability}
                    disabled={isCheckingAvailability}
                    className="w-1/2 py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-brand-dark rounded-xl font-bold text-base transition-all flex items-center justify-center shadow-sm disabled:opacity-70 active:scale-95 duration-200"
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
                    className="w-1/2 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 duration-200"
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

                <WhatsAppCheckout onClick={handleWhatsAppClick} loading={!!(isWhatsappLoading)} />
              </div>
            </form>

            <div className="flex items-center justify-center space-x-1.5 text-brand-text-secondary mt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Secure Payment Protection</span>
            </div>

            {/* COMPACT Live Receipt Breakdown */}
            {pricing && (
              <div className="space-y-2 pt-5 mt-5 border-t border-gray-100">
                <div className="flex justify-between text-gray-600 text-xs">
                  <span className="underline decoration-gray-300 underline-offset-4">
                    ₦{pricing.baseRate.toLocaleString()} x {durationSlots} slots
                  </span>
                  <span className="font-bold text-brand-dark">₦{pricing.rentalTotal.toLocaleString()}</span>
                </div>
                
                {needsChauffeur && (
                  <div className="flex justify-between text-gray-600 text-xs animate-in slide-in-from-top-1 duration-200">
                    <span className="underline decoration-gray-300 underline-offset-4 flex items-center"> Chauffeur Fee</span>
                    <span className="font-bold text-brand-dark">₦{pricing.chauffeurRate.toLocaleString()}</span>
                  </div>
                )}
                
                {pricing.deliveryRate > 0 && (
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span className="underline decoration-gray-300 underline-offset-4">Delivery fee</span>
                    <span className="font-bold text-brand-dark">₦{pricing.deliveryRate.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between font-display font-bold text-brand-dark text-base pt-3 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>₦{pricing.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SIMILAR CARS SECTION --- */}
      {similarCars.length > 0 && (
        <div className="mt-12 pt-16 border-t border-gray-100">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-brand-dark tracking-tight">More luxury vehicles</h3>
              <p className="text-brand-text-secondary font-medium mt-1">Similar premium cars available in {car.location?.city}</p>
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
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-brand-dark uppercase tracking-wider">
                    {simCar.category || 'Luxury'}
                  </div>
                </div>
                
                <div className="p-5">
                  <h4 className="font-bold text-brand-dark text-base truncate mb-1 group-hover:text-brand-primary transition-colors">
                    {simCar.make} {simCar.model}
                  </h4>
                  <p className="text-base text-brand-text-secondary mb-3 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {simCar.location?.city}
                  </p>
                  <div className="flex items-baseline space-x-1 pt-3 border-t border-gray-100">
                    <span className="font-display font-bold text-brand-dark text-lg">₦{(simCar.pricePer12Hours || 0).toLocaleString()}</span>
                    <span className="text-xs text-brand-text-secondary font-medium">/ day</span>
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
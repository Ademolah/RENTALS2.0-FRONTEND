import { useState, useEffect } from 'react';
import { CONCIERGE_WHATSAPP } from '../lib/config';
import { toLocalISO } from '../lib/dates';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Calendar as CalendarIcon, Users, ShieldCheck, ChevronLeft, ChevronRight, CheckCircle2, Wine, Loader2, AlertCircle, X } from 'lucide-react';
import { getVipEstablishmentById, initiateVipReservation } from '../api/vip';
import { checkPropertyAvailability } from '../api/properties';
import AvailabilityNotice from '../components/AvailabilityNotice';
import { addDays } from '../lib/availability';
import ShareButton from '../components/ShareButton';
import { useDocumentMeta } from '../lib/seo';
import { WhatsAppCheckout, WhatsAppPill } from '../components/ui';
import ReviewsSection from '../components/detail/ReviewsSection';
import { DirectionsLink, ManageListingCard, isOwnListing, useSwipe, coordsOf } from '../components/detail/extras';
import { useAuth } from '../context/AuthContext';
import { logUnifiedWhatsappIntent } from '../api/reservation';
import { cleanList } from '../lib/lists';

export default function VipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user, setShowAuthModal } = useAuth();
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  
  const [establishment, setEstablishment] = useState(null);
  useDocumentMeta(establishment?.title, establishment?.description?.slice(0, 160));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reservation State
  const [reservationDate, setReservationDate] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [arrivalTime, setArrivalTime] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Availability check state
  const [availabilityStatus, setAvailabilityStatus] = useState('idle'); // 'idle' | 'checking' | 'free' | 'booked'

  // Image Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const swipe = useSwipe((dir) => setLightboxIndex((i) => (i === null ? i : (i - dir + (establishment?.images?.length || 1)) % (establishment?.images?.length || 1))));

  // Custom Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());


  useEffect(() => {
    async function loadData() {
      try {
        const response = await getVipEstablishmentById(id);
        const est = response.data?.data?.establishment || response.data?.establishment;
        setEstablishment(est);
      } catch {
        setError('Failed to load VIP venue details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // --- ESCROW & RESERVATION LOGIC ---
  const handleEscrowReservation = async () => {
    if (!reservationDate || !arrivalTime) {
      setBookingError("Please select a date and your expected arrival time.");
      return;
    }
    if (availabilityStatus === 'booked') {
      setBookingError("These dates have been booked. Please choose another date.");
      return;
    }
    setIsReserving(true);
    setBookingError('');
    try {
      const response = await initiateVipReservation({
        establishmentId: id,
        reservationDate,
        guestCount,
        arrivalTime,
        callbackUrl: `${window.location.origin}/vip-success`
      });
      const { checkoutUrl } = response.data?.data || response.data;
      if (checkoutUrl) {
        window.location.href = checkoutUrl; 
      } else {
        setBookingError("Failed to initialize payment gateway.");
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || "Failed to initiate reservation.");
    } finally {
      setIsReserving(false);
    }
  };

  const handleWhatsAppReservation = async () => {
    if (!reservationDate || !arrivalTime) {
      setBookingError("Please select a date and your expected arrival time first.");
      setShowCalendar(true);
      return;
    }
    if (availabilityStatus === 'booked') {
      setBookingError("These dates have been booked. Please choose another date.");
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
      // 1. Fire intent to database
      const response = await logUnifiedWhatsappIntent({
        assetId: id,
        assetType: 'VIP', 
        startDate: reservationDate,
        extraData: { guests: guestCount }
      });

      // 2. Retrieve secure reference
      const reference = response.data?.data?.reference || response.data?.reference;
      if (!reference) throw new Error('No reference');

      // 3. Inject reference into the message
      const message = `Hi Rentals Africa, I am ${user.firstName}, a verified guest. I would like to request a VIP reservation.\n\n*Venue:* ${establishment.title}\n*Date:* ${reservationDate}\n*Time:* ${arrivalTime}\n*Guests:* ${guestCount}\n*Reference:* ${reference}\n\nPlease assist with securing my deposit.`;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback: open WhatsApp without a reference so the user is never blocked
      const message = `Hi Rentals Africa, I am ${user.firstName}, a verified guest. I would like to request a VIP reservation.\n\n*Venue:* ${establishment.title}\n*Date:* ${reservationDate}\n*Time:* ${arrivalTime}\n*Guests:* ${guestCount}\n\nPlease assist with securing my deposit.`;
      window.open(`https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  // --- CUSTOM CALENDAR ENGINE ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const generateCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleDateSelect = async (dateObj) => {
    const offsetDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
    const selected = offsetDate.toISOString().split('T')[0];
    setReservationDate(selected);
    setShowCalendar(false);
    setBookingError('');
    setAvailabilityStatus('checking');
    try {
      const result = await checkPropertyAvailability(id, { startDate: selected, endDate: addDays(selected, 1) });
      setAvailabilityStatus(result?.available === false ? 'booked' : 'free');
    } catch {
      setAvailabilityStatus('idle');
    }
  };

  const nextMonth = () => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
  const prevMonth = () => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));

  // --- LIGHTBOX NAVIGATION ---
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % establishment.images.length);
  const prevImage = () => setLightboxIndex((prev) => (prev === 0 ? establishment.images.length - 1 : prev - 1));


  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
        <p className="text-amber-500/60 font-bold uppercase tracking-[0.2em] text-xs">Curating Experience...</p>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Listing not found</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">Go Back</button>
      </div>
    );
  }

  const images = establishment.images || [];
  const ownListing = isOwnListing(user, establishment.ownerId?._id || establishment.ownerId || establishment.landlordId?._id || establishment.landlordId);
  const depositAmount = establishment.depositAmount || establishment.pricePerNight || 0;
  const platformFee = 0;
  const grandTotal = depositAmount + platformFee;
  const formattedType = establishment.establishmentType?.replace('_', ' ') || 'VIP VENUE';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-24 selection:bg-amber-500 selection:text-black overflow-x-hidden relative">
      
      {/* FULL SCREEN LIGHTBOX */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setLightboxIndex(null)} {...swipe}>
          <button onClick={() => setLightboxIndex(null)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors" aria-label="Close">
            <X className="w-8 h-8" />
          </button>
          
          {images.length > 1 && (
            <button onClick={prevImage} className="absolute left-4 md:left-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all" aria-label="Previous">
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          <img 
            src={images[lightboxIndex]} 
            alt="Expanded view" 
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button onClick={nextImage} className="absolute right-4 md:right-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all" aria-label="Next">
              <ChevronRight className="w-10 h-10" />
            </button>
          )}
          
          <div className="absolute bottom-8 left-0 w-full text-center text-white/70 font-semibold tracking-wide text-base">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}

      {/* IMMERSIVE HERO NAVIGATION - Fixed Overlap Issue */}
      <div className="absolute top-24 md:top-32 left-0 w-full z-50 px-6 md:px-12 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full hover:bg-amber-500 hover:text-black transition-all text-white shadow-lg"
         aria-label="Previous">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* DYNAMIC IMAGE GRID */}
      <div className="w-full h-[50vh] md:h-[70vh] flex overflow-hidden relative">
        {images.length > 1 && (
          <button onClick={() => setLightboxIndex(0)} className="absolute bottom-6 right-6 z-20 bg-white text-black font-semibold text-base px-5 py-3 rounded-xl shadow-elevated hover:bg-gray-100">
            View all {images.length} photos
          </button>
        )}
        {images.length > 0 ? (
          <div className={`w-full h-full flex ${images.length === 1 ? '' : 'gap-1 md:gap-2'} overflow-x-auto snap-x snap-mandatory md:overflow-hidden`}>
            
            {/* Primary Image (Left half on Desktop, full on Mobile) */}
            <div 
              onClick={() => setLightboxIndex(0)}
              className={`h-full relative group overflow-hidden shrink-0 snap-center cursor-pointer ${images.length === 1 ? 'w-full' : 'w-full md:w-1/2'}`}
            >
              <img src={images[0]} alt="Main" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80 md:opacity-0 group-hover:bg-black/10 transition-colors"></div>
            </div>
            
            {/* Desktop Dynamic Right Grid (Hidden on Mobile, relying on flex scroll if they swipe) */}
            {images.length > 1 && (
              <div className={`hidden md:grid h-full gap-2 ${
                images.length === 2 ? 'w-1/2 grid-cols-1 grid-rows-1' :
                images.length === 3 ? 'w-1/2 grid-cols-1 grid-rows-2' :
                images.length === 4 ? 'w-1/2 grid-cols-2 grid-rows-2' :
                'w-1/2 grid-cols-2 grid-rows-2'
              }`}>
                {images.slice(1, 5).map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setLightboxIndex(idx + 1)}
                    className={`relative group overflow-hidden cursor-pointer ${images.length === 4 && idx === 0 ? 'col-span-2' : ''}`}
                  >
                    <img src={img} alt={`Gallery ${idx+1}`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 group-hover:bg-black/10 transition-colors"></div>
                    
                    {/* +More Overlay for 5+ images */}
                    {images.length > 5 && idx === 3 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold tracking-widest text-lg">+{images.length - 5} MORE</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Mobile Fallback extra images (for swipe) */}
            {images.slice(1).map((img, idx) => (
              <div key={`mob-${idx}`} onClick={() => setLightboxIndex(idx + 1)} className="w-full h-full relative shrink-0 snap-center md:hidden cursor-pointer">
                <img src={img} alt={`${establishment.title} photo ${idx + 2}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80"></div>
              </div>
            ))}
            
          </div>
        ) : (
          <div className="w-full h-full bg-gray-900"></div>
        )}
      </div>

      {/* MAIN CONTENT LAYOUT */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 -mt-16 md:mt-12 relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* LEFT COLUMN: DETAILS */}
        <div className="flex-1 space-y-12">
          
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-[0.2em] flex items-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                {formattedType}
              </span>
              {establishment.openHours?.daysOpen?.map(day => (
                <span key={day} className="text-xs font-bold uppercase tracking-widest text-white/70 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                  {day.substring(0, 3)}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tighter mb-4 leading-none">
              {establishment.title}
            </h1>
            <div className="mb-4 flex flex-wrap items-center gap-3"><ShareButton dark /><WhatsAppPill /></div>
            <p className="mb-3 text-base font-medium text-white/70">Managed by Rentals Africa</p>
            <div className="flex items-center text-white/70 text-base font-medium">
              <MapPin className="w-4 h-4 mr-2 text-amber-500" />
              {establishment.address?.street}, {establishment.address?.city}, {establishment.address?.state}
            </div>
            <DirectionsLink className="mt-3 !text-amber-400 hover:!text-amber-300" {...coordsOf(establishment.address?.coordinates || establishment.location?.coordinates)} address={[establishment.address?.street, establishment.address?.city, establishment.address?.state].filter(Boolean).join(', ')} />
          </div>

          <hr className="border-white/10" />

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-6">The Experience</h3>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-medium">
              {establishment.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <Wine className="w-6 h-6 text-amber-500 mb-4" />
              <h4 className="text-white font-bold text-xl mb-2">Dress Code</h4>
              <p className="text-white/70 text-base leading-relaxed">{establishment.dressCode || "Strictly smart elegant. Management reserves the right of admission."}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <Clock className="w-6 h-6 text-amber-500 mb-4" />
              <h4 className="text-white font-bold text-xl mb-2">Operating Hours</h4>
              <p className="text-white/70 text-base leading-relaxed">{establishment.openHours?.open} to {establishment.openHours?.close}</p>
            </div>
          </div>

          {cleanList(establishment.services).length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-6">Concierge Services Available</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cleanList(establishment.services).map((service, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-base font-bold tracking-wide">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 md:p-8 text-brand-text [&>section]:border-0 [&>section]:pb-0">
            <ReviewsSection listingId={establishment._id || id} fallback={{ rating: establishment.rating, count: establishment.numReviews }} />
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY ESCROW CARD */}
        <div className="w-full lg:w-[420px] shrink-0">
          {ownListing ? <ManageListingCard status={String(establishment.status || '').toLowerCase()} /> : (
          <div className="sticky top-32 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-elevated relative overflow-visible">
            
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <div className="mb-8">
                <span className="block text-xs font-display font-bold uppercase tracking-widest text-amber-500 mb-2">Required Deposit</span>
                <div className="flex items-baseline text-white">
                  <span className="text-4xl font-display font-bold tracking-tighter">₦{depositAmount.toLocaleString()}</span>
                </div>
              </div>

              {availabilityStatus === 'checking' && (
                <div className="mb-6 flex items-center gap-2 text-sm text-white/70">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking availability…
                </div>
              )}
              {availabilityStatus === 'booked' && reservationDate && (
                <div className="mb-6">
                  <AvailabilityNotice
                    start={reservationDate}
                    end={addDays(reservationDate, 1)}
                    isFree={async (s) => {
                      const r = await checkPropertyAvailability(id, { startDate: s, endDate: addDays(s, 1) });
                      return r?.available !== false;
                    }}
                    onPick={(s) => { setReservationDate(s); setAvailabilityStatus('free'); setBookingError(''); }}
                  />
                </div>
              )}
              {bookingError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                  <span className="leading-relaxed">{bookingError}</span>
                </div>
              )}

              <div className="space-y-4 mb-8">
                
                {/* CUSTOM ELEGANT DATE PICKER */}
                <div className="relative">
                  <div 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 cursor-pointer hover:border-amber-500/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="w-5 h-5 text-brand-text-muted absolute left-4" />
                      <span className={reservationDate ? 'text-white' : 'text-brand-text-secondary'}>
                        {reservationDate ? new Date(reservationDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select Date'}
                      </span>
                    </div>
                  </div>

                  {/* Calendar Popover */}
                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-gray-900 border border-white/10 rounded-2xl shadow-elevated p-5 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-full text-white" aria-label="Previous"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="font-bold text-sm tracking-widest uppercase text-white">
                          {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-full text-white" aria-label="Next"><ChevronRight className="w-5 h-5"/></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-white/60 tracking-widest uppercase">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().map((dateObj, i) => {
                          if (!dateObj) return <div key={i} className="h-8"></div>;
                          const isPast = dateObj < today;
                          const isSelected = reservationDate && toLocalISO(dateObj) === reservationDate;
                          return (
                            <button
                              key={i}
                              disabled={isPast}
                              onClick={() => handleDateSelect(dateObj)}
                              className={`h-9 rounded-full text-sm font-bold transition-all flex items-center justify-center
                                ${isPast ? 'text-gray-600 cursor-not-allowed' : 
                                  isSelected ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25' : 
                                  'text-gray-200 hover:bg-white/10'}
                              `}
                            >
                              {dateObj.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-text-muted">
                      <Clock className="w-5 h-5" />
                    </div>
                    <input 
                      type="time" 
                      value={arrivalTime} 
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-amber-500 transition-colors [color-scheme:dark]"
                    />
                  </div>

                  <div className="relative w-32">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-text-muted">
                      <Users className="w-5 h-5" />
                    </div>
                    <input 
                      type="number" 
                      min="1" max="20"
                      value={guestCount} 
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Escrow Math */}
              <div className="space-y-3 border-t border-white/10 pt-6 mb-8 text-base font-medium">
                <div className="flex justify-between text-brand-text-muted">
                  <span>Venue Deposit</span>
                  <span className="text-white">₦{depositAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className="text-white font-bold">Total Guarantee</span>
                  <span className="text-xl font-display font-bold text-amber-500">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 relative z-0">
                <button 
                  onClick={handleEscrowReservation}
                  disabled={isReserving}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl font-bold uppercase tracking-widest text-base transition-all active:scale-[0.98] flex justify-center items-center"
                >
                  {isReserving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Make Reservation"}
                </button>
                
                <WhatsAppCheckout onClick={handleWhatsAppReservation} loading={!!(isWhatsappLoading)} />
              </div>

              <div className="mt-6 flex items-start gap-3 text-sm text-white/60 leading-relaxed font-medium">
                <ShieldCheck className="w-8 h-8 text-amber-500 shrink-0 -mt-1" />
                <p>Your deposit is held securely by Rentals Africa. Funds are only released to the venue upon your physical arrival and check-in. Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment.</p>
              </div>

            </div>
          </div>
          )}
        </div>

      </div>
    </main>
  );
}
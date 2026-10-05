import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Clock, Calendar as CalendarIcon, Users, ShieldCheck, 
  ChevronLeft, ChevronRight, Sparkles, CheckCircle2, MessageCircle, 
  Wine, Loader2, AlertCircle, X
} from 'lucide-react';
import { getVipEstablishmentById, initiateVipReservation } from '../api/vip';

export default function VipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reservation State
  const [reservationDate, setReservationDate] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [arrivalTime, setArrivalTime] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Image Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Custom Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const CONCIERGE_WHATSAPP = "2348000000000"; 

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getVipEstablishmentById(id);
        const est = response.data?.data?.establishment || response.data?.establishment;
        setEstablishment(est);
      } catch (err) {
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
    setIsReserving(true);
    setBookingError('');
    try {
      const response = await initiateVipReservation({
        establishmentId: id,
        reservationDate,
        guestCount,
        arrivalTime
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

  const handleWhatsAppReservation = () => {
    if (!reservationDate || !arrivalTime) {
      setBookingError("Please select a date and time first.");
      return;
    }
    const message = `Hello Concierge, I would like to request a VIP reservation.\n\n*Venue:* ${establishment.title}\n*Date:* ${reservationDate}\n*Time:* ${arrivalTime}\n*Guests:* ${guestCount}\n\nPlease assist with securing my deposit.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodedMessage}`, '_blank');
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

  const handleDateSelect = (dateObj) => {
    const offsetDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
    setReservationDate(offsetDate.toISOString().split('T')[0]);
    setShowCalendar(false);
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
        <h2 className="text-2xl font-bold mb-4">Venue Unavailable</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">Go Back</button>
      </div>
    );
  }

  const images = establishment.images || [];
  const depositAmount = establishment.depositAmount || establishment.pricePerNight || 0;
  const platformFee = Math.round(depositAmount * 0.05);
  const grandTotal = depositAmount + platformFee;
  const formattedType = establishment.establishmentType?.replace('_', ' ') || 'VIP VENUE';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-24 selection:bg-amber-500 selection:text-black overflow-x-hidden relative">
      
      {/* FULL SCREEN LIGHTBOX */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <button onClick={() => setLightboxIndex(null)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors">
            <X className="w-8 h-8" />
          </button>
          
          {images.length > 1 && (
            <button onClick={prevImage} className="absolute left-4 md:left-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all">
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          <img 
            src={images[lightboxIndex]} 
            alt="Expanded view" 
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
          />

          {images.length > 1 && (
            <button onClick={nextImage} className="absolute right-4 md:right-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all">
              <ChevronRight className="w-10 h-10" />
            </button>
          )}
          
          <div className="absolute bottom-8 left-0 w-full text-center text-white/50 font-bold tracking-widest text-xs">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}

      {/* IMMERSIVE HERO NAVIGATION - Fixed Overlap Issue */}
      <div className="absolute top-24 md:top-32 left-0 w-full z-50 px-6 md:px-12 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full hover:bg-amber-500 hover:text-black transition-all text-white shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* DYNAMIC IMAGE GRID */}
      <div className="w-full h-[50vh] md:h-[70vh] flex overflow-hidden">
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
                <img src={img} className="w-full h-full object-cover" />
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
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                {formattedType}
              </span>
              {establishment.openHours?.daysOpen?.map(day => (
                <span key={day} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                  {day.substring(0, 3)}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
              {establishment.title}
            </h1>
            <div className="flex items-center text-gray-400 text-sm font-medium">
              <MapPin className="w-4 h-4 mr-2 text-amber-500" />
              {establishment.address?.street}, {establishment.address?.city}, {establishment.address?.state}
            </div>
          </div>

          <hr className="border-white/10" />

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">The Experience</h3>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-medium">
              {establishment.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <Wine className="w-6 h-6 text-amber-500 mb-4" />
              <h4 className="text-white font-bold text-lg mb-2">Dress Code</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{establishment.dressCode || "Strictly smart elegant. Management reserves the right of admission."}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <Clock className="w-6 h-6 text-amber-500 mb-4" />
              <h4 className="text-white font-bold text-lg mb-2">Operating Hours</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{establishment.openHours?.open} to {establishment.openHours?.close}</p>
            </div>
          </div>

          {establishment.services && establishment.services.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Concierge Services Available</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {establishment.services.map((service, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-sm font-bold tracking-wide">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY ESCROW CARD */}
        <div className="w-full lg:w-[420px] shrink-0">
          <div className="sticky top-32 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-visible">
            
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <div className="mb-8">
                <span className="block text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Required Escrow Deposit</span>
                <div className="flex items-baseline text-white">
                  <span className="text-4xl font-black tracking-tighter">₦{depositAmount.toLocaleString()}</span>
                </div>
              </div>

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
                      <CalendarIcon className="w-5 h-5 text-gray-400 absolute left-4" />
                      <span className={reservationDate ? 'text-white' : 'text-gray-500'}>
                        {reservationDate ? new Date(reservationDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select Date'}
                      </span>
                    </div>
                  </div>

                  {/* Calendar Popover */}
                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-full text-white"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="font-bold text-sm tracking-widest uppercase text-white">
                          {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-full text-white"><ChevronRight className="w-5 h-5"/></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().map((dateObj, i) => {
                          if (!dateObj) return <div key={i} className="h-8"></div>;
                          const isPast = dateObj < today;
                          const isSelected = reservationDate && dateObj.toISOString().split('T')[0] === reservationDate;
                          return (
                            <button
                              key={i}
                              disabled={isPast}
                              onClick={() => handleDateSelect(dateObj)}
                              className={`h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center
                                ${isPast ? 'text-gray-600 cursor-not-allowed' : 
                                  isSelected ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25' : 
                                  'text-gray-300 hover:bg-white/10'}
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
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
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
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
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
              <div className="space-y-3 border-t border-white/10 pt-6 mb-8 text-sm font-medium">
                <div className="flex justify-between text-gray-400">
                  <span>Venue Deposit</span>
                  <span className="text-white">₦{depositAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Platform Fee (5%)</span>
                  <span className="text-white">₦{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className="text-white font-bold">Total Guarantee</span>
                  <span className="text-xl font-black text-amber-500">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 relative z-0">
                <button 
                  onClick={handleEscrowReservation}
                  disabled={isReserving}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all active:scale-[0.98] flex justify-center items-center"
                >
                  {isReserving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Make Reservation"}
                </button>
                
                <button 
                  onClick={handleWhatsAppReservation}
                  className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex justify-center items-center gap-2"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-5 h-5 mr-2 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Book via WhatsApp
                </button>
              </div>

              <div className="mt-6 flex items-start gap-3 text-xs text-gray-500 leading-relaxed font-medium">
                <ShieldCheck className="w-8 h-8 text-amber-500 shrink-0 -mt-1" />
                <p>Your deposit is held securely in escrow by Rentals. Funds are only released to the venue upon your physical arrival and check-in.</p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
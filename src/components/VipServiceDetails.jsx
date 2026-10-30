import { useState, useEffect } from 'react';
import { toLocalISO } from '../lib/dates';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar as CalendarIcon, ShieldCheck, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Loader2, AlertCircle, X, Clock, UserCheck
} from 'lucide-react';
import { getVipServiceById, initiateVipServiceReservation } from '../api/vip';
import { logUnifiedWhatsappIntent } from '../api/reservation';
import ShareButton from './ShareButton';
import { useAuth } from '../context/AuthContext';
import { useDocumentMeta } from '../lib/seo';

export default function VipServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { user, setShowAuthModal } = useAuth();
  const [service, setService] = useState(null);
  useDocumentMeta(service?.title, service?.description?.slice(0, 160));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reservation State
  const [startDate, setStartDate] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [isReserving, setIsReserving] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Image Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Custom Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const CONCIERGE_WHATSAPP = "2347063688222"; 

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getVipServiceById(id);
        const data = response.data?.service || response.data;
        setService(data);
      } catch (err) {
        setError('Failed to load VIP service details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // --- ESCROW & RESERVATION LOGIC ---
  const handleEscrowReservation = async () => {
    if (!startDate) {
      setBookingError("Please select a start date for the service.");
      return;
    }
    setIsReserving(true);
    setBookingError('');
    
    try {
      // Calculate end date based on duration
      const end = new Date(startDate);
      end.setDate(end.getDate() + durationDays);
      const endDate = end.toISOString().split('T')[0];

      const response = await initiateVipServiceReservation({
        serviceId: id,
        startDate,
        endDate,
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
    if (!startDate) {
      setBookingError("Please select a start date first.");
      return;
    }
    if (!user) {
      setShowAuthModal?.(true);
      return;
    }
    setBookingError('');
    try {
      const end = new Date(`${startDate}T00:00:00`);
      end.setDate(end.getDate() + durationDays);
      const response = await logUnifiedWhatsappIntent({
        assetId: id,
        assetType: 'VIP',
        startDate,
        endDate: toLocalISO(end),
        extraData: { durationDays }
      });
      const reference = response.data?.data?.reference || response.data?.reference;
      if (!reference) throw new Error('No reference');
      const message = `Hello Concierge, I would like to request a VIP Service reservation.

*Service:* ${service.title}
*Start Date:* ${startDate}
*Duration:* ${durationDays} Day(s)
*Reference:* ${reference}

Please assist with securing my deposit.`;
      window.open(`https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
    } catch {
      setBookingError('Could not start the WhatsApp booking. Please try again.');
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
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return days;
  };

  const handleDateSelect = (dateObj) => {
    const offsetDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
    setStartDate(offsetDate.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  const nextMonth = () => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
  const prevMonth = () => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));

  // --- LIGHTBOX NAVIGATION ---
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % service.images.length);
  const prevImage = () => setLightboxIndex((prev) => (prev === 0 ? service.images.length - 1 : prev - 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
        <p className="text-amber-500/60 font-bold uppercase tracking-[0.2em] text-xs">Curating Service...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Service Unavailable</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">Go Back</button>
      </div>
    );
  }

  const images = service.images || [];
  
  // Dynamic Pricing Calculation
  const dailyRate = service.pricePerDay || service.pricePerNight || 0;
  const subtotal = dailyRate * durationDays;
  const platformFee = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + platformFee;
  
  const formattedType = service.establishmentType?.replace('_', ' ') || 'VIP SERVICE';
  const providerName = 'Rentals Africa';
  
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

      {/* IMMERSIVE HERO NAVIGATION */}
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
            <div 
              onClick={() => setLightboxIndex(0)}
              className={`h-full relative group overflow-hidden shrink-0 snap-center cursor-pointer ${images.length === 1 ? 'w-full' : 'w-full md:w-1/2'}`}
            >
              <img src={images[0]} alt="Main" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80 md:opacity-0 group-hover:bg-black/10 transition-colors"></div>
            </div>
            
            {images.length > 1 && (
              <div className={`hidden md:grid h-full gap-2 ${
                images.length === 2 ? 'w-1/2 grid-cols-1 grid-rows-1' :
                images.length === 3 ? 'w-1/2 grid-cols-1 grid-rows-2' :
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
                    {images.length > 5 && idx === 3 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold tracking-widest text-lg">+{images.length - 5} MORE</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
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
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-[0.2em] flex items-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <ShieldCheck className="w-3 h-3 mr-1.5" />
                {formattedType}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tighter mb-4 leading-none">
              {service.title}
            </h1>
            <ShareButton dark className="mb-4" />
            <div className="flex items-center text-white/70 text-base font-medium">
              <MapPin className="w-4 h-4 mr-2 text-amber-500" />
              {service.address?.street && `${service.address.street}, `}{service.address?.city}, {service.address?.state}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Service Provider Info */}
          <div className="flex items-center space-x-4 bg-white/5 border border-white/10 p-5 rounded-3xl w-fit">
            <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center">
               <UserCheck className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-0.5">Provided By</p>
              <p className="text-base font-bold text-white tracking-wide">{providerName}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-6">Service Overview</h3>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-medium">
              {service.description}
            </p>
          </div>

          {/* What's Included (Services Array) */}
          {service.services && service.services.length > 0 && (
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-6">What's Included</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {service.services.map((inclusion, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-base font-bold tracking-wide leading-relaxed">{inclusion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY ESCROW CARD */}
        <div className="w-full lg:w-[420px] shrink-0">
          <div className="sticky top-32 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-elevated relative overflow-visible">
            
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <div className="mb-8">
                <span className="block text-xs font-display font-bold uppercase tracking-widest text-amber-500 mb-2">Daily Rate</span>
                <div className="flex items-baseline text-white">
                  <span className="text-4xl font-display font-bold tracking-tighter">₦{dailyRate.toLocaleString()}</span>
                  <span className="text-white/60 text-base ml-2 font-bold">/ day</span>
                </div>
              </div>

              {bookingError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                  <span className="leading-relaxed">{bookingError}</span>
                </div>
              )}

              <div className="space-y-4 mb-8">
                
                {/* START DATE PICKER */}
                <div className="relative">
                  <div 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 cursor-pointer hover:border-amber-500/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="w-5 h-5 text-brand-text-muted absolute left-4" />
                      <span className={startDate ? 'text-white' : 'text-white/60'}>
                        {startDate ? new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select Start Date'}
                      </span>
                    </div>
                  </div>

                  {/* Calendar Popover */}
                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-gray-900 border border-white/10 rounded-2xl shadow-elevated p-5 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-full text-white"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="font-bold text-sm tracking-widest uppercase text-white">
                          {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-full text-white"><ChevronRight className="w-5 h-5"/></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-white/60 tracking-widest uppercase">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().map((dateObj, i) => {
                          if (!dateObj) return <div key={i} className="h-8"></div>;
                          const isPast = dateObj < today;
                          const isSelected = startDate && toLocalISO(dateObj) === startDate;
                          return (
                            <button
                              key={i}
                              disabled={isPast}
                              onClick={() => handleDateSelect(dateObj)}
                              className={`h-9 rounded-full text-sm font-bold transition-all flex items-center justify-center
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

                {/* DURATION PICKER */}
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-text-muted z-10">
                    <Clock className="w-5 h-5" />
                  </div>
                  <select 
                    value={durationDays} 
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 text-white font-bold rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer relative z-0"
                  >
                    {[...Array(30)].map((_, i) => (
                      <option key={i+1} value={i+1} className="bg-gray-900 text-white py-2">
                        {i+1} Day{i+1 > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 text-brand-text-secondary absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>
              </div>

              {/* Escrow Math */}
              <div className="space-y-3 border-t border-white/10 pt-6 mb-8 text-base font-medium">
                <div className="flex justify-between text-brand-text-muted">
                  <span>₦{dailyRate.toLocaleString()} x {durationDays} day{durationDays > 1 ? 's' : ''}</span>
                  <span className="text-white">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-brand-text-muted">
                  <span>Platform Fee (5%)</span>
                  <span className="text-white">₦{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className="text-white font-bold">Total Escrow</span>
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
                  {isReserving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Reservation"}
                </button>
                
                <button 
                  onClick={handleWhatsAppReservation}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-base shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Book via WhatsApp
                </button>
              </div>

              <div className="mt-6 flex items-start gap-3 text-sm text-white/60 leading-relaxed font-medium">
                <ShieldCheck className="w-8 h-8 text-amber-500 shrink-0 -mt-1" />
                <p>Payment is securely held in platform escrow and is only released to the provider upon confirmed delivery of service. Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment.</p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
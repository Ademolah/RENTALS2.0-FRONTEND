import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Clock, Calendar, Users, ShieldCheck, 
  ChevronLeft, Sparkles, CheckCircle2, MessageCircle, 
  Wine, Navigation, Loader2, AlertCircle
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

  // Platform WhatsApp Number (Replace with your actual Concierge Number)
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
        window.location.href = checkoutUrl; // Redirect to Paystack
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

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-24 selection:bg-amber-500 selection:text-black">
      
      {/* IMMERSIVE HERO NAVIGATION */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 md:p-10 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full hover:bg-black/60 transition-colors text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* WORLD-CLASS IMAGE GRID (Desktop: 5 Images, Mobile: Horizontal Scroll) */}
      <div className="w-full h-[50vh] md:h-[70vh] flex overflow-hidden">
        {images.length > 0 ? (
          <div className="w-full h-full flex gap-1 md:gap-2">
            <div className="w-full md:w-1/2 h-full relative group overflow-hidden shrink-0">
              <img src={images[0]} alt="Main" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80 md:opacity-0"></div>
            </div>
            
            <div className="hidden md:grid w-1/2 h-full grid-cols-2 grid-rows-2 gap-2">
              {images.slice(1, 5).map((img, idx) => (
                <div key={idx} className="relative group overflow-hidden">
                  <img src={img} alt={`Gallery ${idx+1}`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                </div>
              ))}
              {/* Fill empty spots if less than 5 images */}
              {Array.from({ length: Math.max(0, 4 - (images.length - 1)) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-900/50 w-full h-full"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-900"></div>
        )}
      </div>

      {/* MAIN CONTENT LAYOUT */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 -mt-16 md:mt-12 relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* LEFT COLUMN: DETAILS */}
        <div className="flex-1 space-y-12">
          
          {/* Header Info */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Sparkles className="w-3 h-3 mr-1.5" /> {formattedType}
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

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">The Experience</h3>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-medium">
              {establishment.description}
            </p>
          </div>

          {/* Core Rules & Vibe */}
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

          {/* Services */}
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
          <div className="sticky top-32 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            
            {/* Ambient Card Glow */}
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
                
                {/* Date Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input 
                    type="date" 
                    value={reservationDate} 
                    onChange={(e) => setReservationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-amber-500 transition-colors [color-scheme:dark]"
                  />
                </div>

                <div className="flex gap-4">
                  {/* Arrival Time Input */}
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

                  {/* Guests Input */}
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
              <div className="space-y-3">
                <button 
                  onClick={handleEscrowReservation}
                  disabled={isReserving}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all active:scale-[0.98] flex justify-center items-center"
                >
                  {isReserving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Reservation"}
                </button>
                
                <button 
                  onClick={handleWhatsAppReservation}
                  className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex justify-center items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" /> Book via WhatsApp
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
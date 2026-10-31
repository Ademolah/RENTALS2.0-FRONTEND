import { useState, useMemo, useEffect } from 'react';
import { WhatsAppCheckout } from './ui';
import { Star, Loader2, ShieldCheck, Clock, Info, Plus, Minus, CalendarSearch, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logUnifiedWhatsappIntent, saveCheckoutDraft } from '../api/reservation';
import { checkPropertyAvailability, getPropertyById } from '../api/properties';
import { useAuth } from '../context/AuthContext';
import AvailabilityNotice from './AvailabilityNotice';
import { CONCIERGE_WHATSAPP } from '../lib/config';
import { isNightBooked, rangeBooked } from '../lib/availability';

export default function BookingWidget({ property }) {
  const { user, setShowAuthModal } = useAuth();
  const navigate = useNavigate();
  const [bookedDates, setBookedDates] = useState(property?.bookedDates || []);

  useEffect(() => {
    if (property?.bookedDates?.length || !property?.id) return undefined;
    let active = true;
    getPropertyById(property.id)
      .then((res) => {
        const p = res?.data?.property || res?.property || res;
        if (active && Array.isArray(p?.bookedDates)) setBookedDates(p.bookedDates);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [property?.id, property?.bookedDates]);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null); 

  // --- CUSTOM CALENDAR STATE ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState('checkIn'); // 'checkIn' | 'checkOut'
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  useEffect(() => {
    setAvailabilityStatus(null);
    setError('');
  }, [checkIn, checkOut]);

  const pricingDetails = useMemo(() => {
    if (!checkIn || !checkOut || !property?.price) return null;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return null;

    const baseTotal = nights * property.price;
    const platformFee = 0;
    const grandTotal = baseTotal + platformFee;

    return { nights, baseTotal, platformFee, grandTotal };
  }, [checkIn, checkOut, property]);

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
    const dateStr = offsetDate.toISOString().split('T')[0];

    if (calendarMode === 'checkIn') {
      setCheckIn(dateStr);
      if (checkOut && dateStr >= checkOut) {
        setCheckOut('');
      }
      setCalendarMode('checkOut'); // Auto-switch to checkout mode
    } else {
      setCheckOut(dateStr);
      setShowCalendar(false); // Close when complete
    }
  };

  const nextMonth = (e) => { e.preventDefault(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)); };
  const prevMonth = (e) => { e.preventDefault(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)); };

  const openCalendar = (mode) => {
    setCalendarMode(mode);
    setShowCalendar(true);
  };

  // --- API HANDLERS ---
  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates first.');
      return false;
    }
    
    setIsCheckingAvailability(true);
    setError('');
    
    try {
      const response = await checkPropertyAvailability(property.id, { 
        startDate: checkIn, 
        endDate: checkOut 
      });
      
      if (response.available) {
        setAvailabilityStatus('available');
        return true;
      } else {
        setAvailabilityStatus('booked');
        if (response.message) setError(response.message);
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify dates. Please try again.');
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    if (!user) {
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }

    if (!checkIn || !checkOut || !pricingDetails || pricingDetails.nights <= 0) {
      setError('Please select valid check-in and check-out dates.');
      return;
    }

    if (availabilityStatus === 'booked') {
      setError('These dates have been booked.');
      return;
    }

    setLoading(true);
    setError('');

    // INTERCEPTOR: Auto-Check Availability if the user bypassed the manual check button
    if (availabilityStatus !== 'available') {
      const isAvailable = await handleCheckAvailability();
      if (!isAvailable) {
        setLoading(false);
        return; // Halts the booking process and displays the error automatically
      }
    }

    const fmt = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    saveCheckoutDraft({
      kind: 'property',
      tag: 'Shortlet',
      title: property.title,
      subtitle: property.location,
      image: property.images?.[0] || property.image,
      backTo: `/property/${property.id}`,
      details: [
        { label: 'Check-in', value: fmt(checkIn) },
        { label: 'Check-out', value: fmt(checkOut) },
        { label: 'Guests', value: String(guests) },
      ],
      lines: [{ label: `₦${Number(property.price).toLocaleString()} x ${pricingDetails.nights} night${pricingDetails.nights > 1 ? 's' : ''}`, amount: pricingDetails.baseTotal }],
      total: pricingDetails.grandTotal,
      payload: {
        propertyId: property.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestsCount: guests,
        totalAmount: pricingDetails.grandTotal,
      },
    });
    setLoading(false);
    navigate('/checkout');
  };

  const handleWhatsAppClick = async (e) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut) {
      setError('Please select your check-in and check-out dates before contacting the concierge.');
      setShowCalendar(true);
      setCalendarMode('checkIn');
      return;
    }

    if (!user) {
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }

    if (user.role !== 'USER') {
      setError('Only guest accounts can make reservations.');
      return;
    }

    setIsWhatsappLoading(true);
    setError('');

    try {
      // 1. Fire intent to database to secure the audit trail
      const response = await logUnifiedWhatsappIntent({
        assetId: property.id || property._id,
        assetType: property.category === 'HOTEL' ? 'HOTEL' : property.category === 'VIP RESERVATION' ? 'VIP' : 'SHORTLET',
        startDate: checkIn,
        endDate: checkOut,
        extraData: { guests }
      });

      // 2. Retrieve secure reference from your backend
      const reference = response.data?.data?.reference || response.data?.reference;
      if (!reference) throw new Error('No reference returned');

      // 3. Inject reference into the message
      const WHATSAPP_NUMBER = CONCIERGE_WHATSAPP;
      const propertyIdText = property?.propertyId ? ` (ID: ${property.propertyId})` : '';
      
      const waMessage = encodeURIComponent(
        `Hi Rentals Africa, I am ${user.firstName}, a verified guest. I am interested in booking:\n\n` +
        `🏠 Property: ${property?.title || 'Luxury Shortlet'}${propertyIdText}\n` +
        `📍 Location: ${property?.location || 'Not specified'}\n` +
        `📅 Dates: ${checkIn} to ${checkOut}\n` +
        `👥 Guests: ${guests}\n` +
        `🔒 Reference: ${reference}\n\n` +
        `Could you please assist me with this reservation?`
      );

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`, '_blank');
    } catch (err) {
      setError("Failed to initialize secure chat. Please try again.");
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  const currentPrice = property?.price || 0;
  const maxAllowedGuests = property?.maxGuests || 1;

  return (
    <div className="bg-white border border-gray-100 p-7 rounded-3xl shadow-elevated">
      
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-display font-bold text-brand-dark tracking-tight">
            ₦{pricingDetails ? pricingDetails.baseTotal.toLocaleString() : Number(currentPrice).toLocaleString()}
          </span>
          <span className="text-brand-text-secondary text-base font-medium">
            {pricingDetails ? '/ total' : '/ night'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-5 h-5 fill-brand-star text-brand-star" />
          <span className="font-semibold text-base text-brand-dark">{property?.rating || "5.0"}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-start animate-in fade-in">
          <span>{error}</span>
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleReservation} className="space-y-5">
        
        {/* BESPOKE DATE PICKER WRAPPER */}
        <div className="relative">
          <div className={`border rounded-2xl overflow-hidden bg-white shadow-sm transition-all flex flex-col ${showCalendar ? 'border-brand-dark ring-1 ring-brand-dark' : 'border-gray-300'}`}>
            <div className="flex border-b border-gray-300">
              {/* Check-In Button */}
              <div 
                onClick={() => openCalendar('checkIn')}
                className={`flex-1 p-3.5 border-r border-gray-300 relative cursor-pointer transition-colors ${calendarMode === 'checkIn' && showCalendar ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <label className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-secondary block mb-1">Check-in</label>
                <div className="text-base font-semibold text-brand-dark flex items-center">
                  {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Add Date'}
                </div>
              </div>
              
              {/* Check-Out Button */}
              <div 
                onClick={() => openCalendar('checkOut')}
                className={`flex-1 p-3.5 relative cursor-pointer transition-colors ${calendarMode === 'checkOut' && showCalendar ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <label className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-secondary block mb-1">Check-out</label>
                <div className="text-base font-semibold text-brand-dark flex items-center">
                  {checkOut ? new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Add Date'}
                </div>
              </div>
            </div>
            
            {/* Plus / Minus Guest Counter */}
            <div className="p-4 flex justify-between items-center bg-gray-50/50">
              <div>
                <label className="text-xs font-display font-bold uppercase tracking-widest text-brand-dark block">Guests</label>
                <span className="text-sm text-brand-text-secondary font-medium">Max {maxAllowedGuests}</span>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  type="button" 
                  onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                  disabled={guests <= 1}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-brand-text-secondary hover:border-brand-dark hover:text-brand-dark disabled:opacity-30 disabled:hover:border-gray-300 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-semibold text-brand-dark w-5 text-center">{guests}</span>
                <button 
                  type="button" 
                  onClick={() => setGuests(prev => Math.min(maxAllowedGuests, prev + 1))}
                  disabled={guests >= maxAllowedGuests}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-brand-text-secondary hover:border-brand-dark hover:text-brand-dark disabled:opacity-30 disabled:hover:border-gray-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Popover */}
          {showCalendar && (
            <div className="absolute top-[75px] left-0 mt-2 w-full bg-white border border-gray-200 shadow-elevated rounded-2xl p-5 z-50 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                <span className="font-display font-bold text-base tracking-wider uppercase text-brand-dark">
                  {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"><ChevronRight className="w-4 h-4"/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-display font-bold text-brand-text-muted tracking-widest uppercase">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-y-2">
                {generateCalendarDays().map((dateObj, i) => {
                  if (!dateObj) return <div key={i} className="h-9"></div>;
                  
                  const dateStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                  const isPast = dateObj < todayDateObj;
                  const isSelectedIn = dateStr === checkIn;
                  const isSelectedOut = dateStr === checkOut;
                  const isBetween = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
                  
                  const isDisabledForCheckOut = calendarMode === 'checkOut' && checkIn && dateStr <= checkIn;
                  const isTaken = calendarMode === 'checkOut' && checkIn
                    ? rangeBooked(bookedDates, checkIn, dateStr)
                    : isNightBooked(bookedDates, dateStr);
                  const disabled = isPast || isDisabledForCheckOut || isTaken;

                  let bgClass = 'hover:bg-gray-100 text-brand-dark';
                  if (disabled) bgClass = 'text-gray-300 cursor-not-allowed';
                  if (isTaken && !isPast) bgClass = 'text-gray-400 line-through cursor-not-allowed bg-gray-50';
                  if (isBetween) bgClass = 'bg-gray-100 text-brand-dark';
                  if (isSelectedIn || isSelectedOut) bgClass = 'bg-brand-primary text-white shadow-md';

                  return (
                    <button
                      key={i}
                      disabled={disabled}
                      onClick={(e) => { e.preventDefault(); handleDateSelect(dateObj); }}
                      className={`h-9 w-9 mx-auto rounded-full text-sm font-semibold transition-all flex items-center justify-center ${bgClass}`}
                    >
                      {dateObj.getDate()}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">
                  Selecting: {calendarMode === 'checkIn' ? 'Check-in' : 'Check-out'}
                  {bookedDates.length > 0 && <span className="ml-3 normal-case tracking-normal font-medium line-through">Booked</span>}
                </span>
                <button 
                  onClick={(e) => { e.preventDefault(); setShowCalendar(false); }}
                  className="text-sm font-bold text-brand-dark underline underline-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Availability Status Indicator */}
        {availabilityStatus === 'available' && (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-base font-semibold">Dates are available!</span>
          </div>
        )}
        {availabilityStatus === 'booked' && (
          <AvailabilityNotice
            start={checkIn}
            end={checkOut}
            bookedDates={bookedDates}
            isFree={async (s, e) => (await checkPropertyAvailability(property.id, { startDate: s, endDate: e })).available !== false}
            onPick={(s, e) => { setCheckIn(s); setCheckOut(e); }}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={handleCheckAvailability}
              disabled={isCheckingAvailability}
              className="w-1/2 py-4 bg-white border border-gray-300 hover:border-brand-dark text-brand-dark rounded-xl font-semibold text-base transition-all flex items-center justify-center disabled:opacity-70 active:scale-95 duration-200"
            >
              {isCheckingAvailability ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CalendarSearch className="w-4 h-4 mr-2" />
                  Check Availability
                </>
              )}
            </button>

            <button 
              type="submit"
              disabled={loading || availabilityStatus === 'booked'}
              className="w-1/2 py-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-semibold text-base transition-all shadow-glow flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 duration-200"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Book Now'
              )}
            </button>
          </div>

          <WhatsAppCheckout onClick={handleWhatsAppClick} loading={!!(isWhatsappLoading)} />
          
        </div>
      </form>

      {/* Trust & Guarantees Section */}
      <div className="bg-gray-50 rounded-2xl p-5 mt-6 space-y-4 border border-gray-100">
        <div className="flex gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-brand-dark">100% Secured Payment</h4>
            <p className="text-sm text-brand-text-secondary mt-0.5 leading-relaxed">Your payment is held securely by Rentals Africa and only released to the host after check-in.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Clock className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-brand-dark">Caution Fee Protection</h4>
            <p className="text-sm text-brand-text-secondary mt-0.5 leading-relaxed">Fully refundable within 24-48 hours of checkout, subject to a standard property inspection.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-brand-dark">Cancellations & Refunds</h4>
            <p className="text-sm text-brand-text-secondary mt-0.5 leading-relaxed">Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment. Rentals Africa reviews and processes refunds.</p>
          </div>
        </div>
      </div>

      {pricingDetails && (
        <div className="space-y-3 pt-5 mt-5 border-t border-gray-100 animate-in fade-in duration-300">
          <div className="flex justify-between text-brand-text-secondary text-base">
            <span className="underline decoration-gray-300 underline-offset-4">
              ₦{currentPrice.toLocaleString()} x {pricingDetails.nights} nights
            </span>
            <span>₦{pricingDetails.baseTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-brand-dark text-xl pt-3 border-t border-gray-200">
            <span>Total</span>
            <span>₦{pricingDetails.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
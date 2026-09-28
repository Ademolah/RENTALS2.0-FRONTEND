import { useState, useMemo, useEffect } from 'react';
import { Star, Loader2, ShieldCheck, Clock, Info, Plus, Minus, MessageCircle, CalendarSearch, CheckCircle2, XCircle } from 'lucide-react';
import { initiateBooking } from '../api/reservation';
import { checkPropertyAvailability } from '../api/properties';
import { useAuth } from '../context/AuthContext';


export default function BookingWidget({ property }) {
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Availability States
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // 'available' | 'booked' | null

  // Reset availability status if dates change
  useEffect(() => {
    setAvailabilityStatus(null);
    setError('');
  }, [checkIn, checkOut]);

  // Live Price Engine
  const pricingDetails = useMemo(() => {
    if (!checkIn || !checkOut || !property?.price) return null;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return null;

    const baseTotal = nights * property.price;
    const platformFee = Math.round(baseTotal * 0.05); // 5% Platform Escrow Fee
    const grandTotal = baseTotal + platformFee;

    return { nights, baseTotal, platformFee, grandTotal };
  }, [checkIn, checkOut, property]);

  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates first.');
      return;
    }
    
    setIsCheckingAvailability(true);
    setError('');
    
    try {
      // API call to the mathematical overlap engine
      const response = await checkPropertyAvailability(property.id, { 
        startDate: checkIn, 
        endDate: checkOut 
      });
      
      // SURGICAL FIX: Changed from response.isAvailable to response.available
      if (response.available) {
        setAvailabilityStatus('available');
      } else {
        setAvailabilityStatus('booked');
        // Optional: Show the exact message from the backend
        if (response.message) setError(response.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify dates. Please try again.');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to secure this reservation.');
      return;
    }

    if (!pricingDetails || pricingDetails.nights <= 0) {
      setError('Please select valid check-in and check-out dates.');
      return;
    }

    if (availabilityStatus === 'booked') {
      setError('These dates are already booked. Please choose different dates.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await initiateBooking({
        propertyId: property.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestsCount: guests,
        totalAmount: pricingDetails.grandTotal
      });

      const checkoutUrl = response.checkoutUrl || response.data?.checkoutUrl || response.authorization_url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError('Reservation secured, but payment gateway failed to load.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to secure reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const currentPrice = property?.price || 0;
  const maxAllowedGuests = property?.maxGuests || 1;
  
  // WhatsApp Concierge formatting
  const WHATSAPP_NUMBER = "2347063688222"; // Replace with actual Rentals Africa number
  const waMessage = encodeURIComponent(
    `Hi Rentals Africa, I am interested in booking:\n\n` +
    `🏠 Property: ${property?.title || 'Luxury Shortlet'}\n` +
    `📍 Location: ${property?.location || 'Not specified'}\n` +
    `📅 Dates: ${checkIn || '(Not selected)'} to ${checkOut || '(Not selected)'}\n` +
    `👥 Guests: ${guests}\n\n` +
    `Could you please assist me with this reservation?`
  );

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] sticky top-28">
      
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            ₦{Number(currentPrice).toLocaleString()}
          </span>
          <span className="text-gray-500 text-sm font-medium">/ night</span>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
          <span className="font-semibold text-sm text-gray-900">{property?.rating || "5.0"}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-start">
          <span>{error}</span>
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleReservation} className="space-y-5">
        
        {/* Date & Guest Selection */}
        <div className="border border-gray-300 rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-300">
            <div className="flex-1 p-3 border-r border-gray-300 relative">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block">Check-in</label>
              <input 
                type="date" 
                required
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full text-sm outline-none bg-transparent font-medium mt-1 cursor-pointer text-gray-900"
              />
            </div>
            <div className="flex-1 p-3 relative">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block">Check-out</label>
              <input 
                type="date" 
                required
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-sm outline-none bg-transparent font-medium mt-1 cursor-pointer text-gray-900"
              />
            </div>
          </div>
          
          {/* Plus / Minus Guest Counter */}
          <div className="p-4 flex justify-between items-center bg-gray-50/50">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block">Guests</label>
              <span className="text-xs text-gray-500 font-medium">Max {maxAllowedGuests}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                type="button" 
                onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                disabled={guests <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-semibold text-gray-900 w-4 text-center">{guests}</span>
              <button 
                type="button" 
                onClick={() => setGuests(prev => Math.min(maxAllowedGuests, prev + 1))}
                disabled={guests >= maxAllowedGuests}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Availability Status Indicator */}
        {availabilityStatus === 'available' && (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold">Dates are available!</span>
          </div>
        )}
        {availabilityStatus === 'booked' && (
          <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-bold">These dates are already booked.</span>
          </div>
        )}

        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          
          <div className="flex gap-3">
            {/* Check Availability Button */}
            <button 
              type="button"
              onClick={handleCheckAvailability}
              disabled={isCheckingAvailability}
              className="w-1/2 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-xl font-bold text-sm transition-all flex items-center justify-center disabled:opacity-70 active:scale-95 duration-200"
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

            {/* Main Book Button */}
            <button 
              type="submit"
              disabled={loading || availabilityStatus === 'booked'}
              className="w-1/2 py-3.5 bg-gray-900 hover:bg-brand-primary text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 duration-200"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Book Now'
              )}
            </button>
          </div>

          {/* WhatsApp Concierge Button */}
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center active:scale-95 duration-200"
          >
            {/* Official WhatsApp SVG Logo */}
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 mr-2 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Book via WhatsApp
          </a>
          
        </div>
      </form>

      {/* Trust & Guarantees Section */}
      <div className="bg-gray-50 rounded-xl p-4 mt-5 space-y-3.5 border border-gray-100">
        <div className="flex gap-3">
          <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">100% Secured Payment</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Funds are securely held in escrow by Rentals and only released to the host upon successful check-in.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Clock className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">Caution Fee Protection</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Fully refundable within 24-48 hours of checkout, subject to a standard property inspection.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Info className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">Cancellations & Refunds</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Refunds are processed according to our standard platform terms and conditions.</p>
          </div>
        </div>
      </div>

      {pricingDetails && (
        <div className="space-y-3 pt-5 mt-5 border-t border-gray-100 animate-in fade-in duration-300">
          <div className="flex justify-between text-gray-600 text-sm">
            <span className="underline decoration-gray-300 underline-offset-4">
              ₦{currentPrice.toLocaleString()} x {pricingDetails.nights} nights
            </span>
            <span>₦{pricingDetails.baseTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600 text-sm">
            <span className="underline decoration-gray-300 underline-offset-4">Taxes</span>
            <span>₦{pricingDetails.platformFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-200">
            <span>Total</span>
            <span>₦{pricingDetails.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
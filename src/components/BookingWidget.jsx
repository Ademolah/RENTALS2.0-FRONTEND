import { useState, useMemo } from 'react';
import { Star, Loader2, ShieldCheck,Clock, Info, Plus, Minus } from 'lucide-react';
import { initiateBooking } from '../api/reservation';
import { useAuth } from '../context/AuthContext';

export default function BookingWidget({ property }) {
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  
  // Check Availability Status
  const isBooked = property?.isAvailable === false;
  const nextAvailable = property?.nextAvailableDate 
    ? new Date(property.nextAvailableDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown';

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
        <div className={`border border-gray-300 rounded-2xl overflow-hidden ${isBooked ? 'opacity-50' : ''}`}>
          <div className="flex border-b border-gray-300">
            <div className="flex-1 p-3 border-r border-gray-300 relative">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block">Check-in</label>
              <input 
                type="date" 
                required
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                disabled={isBooked}
                className="w-full text-sm outline-none bg-transparent font-medium mt-1 cursor-pointer text-gray-900 disabled:cursor-not-allowed"
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
                disabled={isBooked}
                className="w-full text-sm outline-none bg-transparent font-medium mt-1 cursor-pointer text-gray-900 disabled:cursor-not-allowed"
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
                disabled={guests <= 1 || isBooked}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-semibold text-gray-900 w-4 text-center">{guests}</span>
              <button 
                type="button" 
                onClick={() => setGuests(prev => Math.min(maxAllowedGuests, prev + 1))}
                disabled={guests >= maxAllowedGuests || isBooked}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* NEW: Trust & Guarantees Section */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3.5 border border-gray-100">
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

        {/* Dynamic Button State */}
        {isBooked ? (
          <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm text-center cursor-not-allowed border border-gray-200">
            Currently Booked (Available {nextAvailable})
          </div>
        ) : (
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 hover:bg-brand-primary text-white rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Securing...</span>
              </>
            ) : (
              'Book Now'
            )}
          </button>
        )}
      </form>

      <div className="flex items-center justify-center space-x-2 text-gray-500 mt-4 mb-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-medium">Rentals Protection</span>
      </div>

      {pricingDetails && !isBooked && (
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
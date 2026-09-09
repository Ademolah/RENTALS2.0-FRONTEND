import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { initiateBooking } from '../api/reservation';
import { useAuth } from '../context/AuthContext';

export default function BookingWidget({ propertyId, price }) {
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReservation = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to proceed with this booking.');
      return;
    }

    if (!checkIn || !checkOut) {
      setError('Select valid check-in and check-out dates.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await initiateBooking({
        propertyId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestsCount: Number(guests)
      });

      // Paystack checkout URL returned from backend API
      const checkoutUrl = response.checkoutUrl || response.data?.checkoutUrl || response.authorization_url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl; // Redirect to Paystack
      } else {
        setError('Booking created, but payment initialization failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-card sticky top-28">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-brand-dark">₦{Number(price).toLocaleString()}</span>
          <span className="text-gray-500 text-sm">night</span>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 fill-brand-dark text-brand-dark" />
          <span className="font-semibold text-sm">4.92</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleReservation} className="space-y-4">
        <div className="border border-gray-300 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-300">
            <div className="flex-1 p-3 border-r border-gray-300">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dark block">Check-in</label>
              <input 
                type="date" 
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full text-xs outline-none bg-transparent font-medium mt-1"
              />
            </div>
            <div className="flex-1 p-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dark block">Check-out</label>
              <input 
                type="date" 
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-xs outline-none bg-transparent font-medium mt-1"
              />
            </div>
          </div>
          <div className="p-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dark block">Guests</label>
            <select 
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full text-xs outline-none bg-transparent font-medium mt-1"
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4+ Guests</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-base transition-colors shadow-md flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reserve & Pay via Paystack'}
        </button>
      </form>

      <p className="text-center text-gray-500 text-xs mt-4">Protected by Rentals Escrow Security</p>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { WhatsAppCheckout } from './ui';
import { X, Clock, ShieldCheck, CreditCard, CalendarDays, MapPin, CheckCircle2 } from 'lucide-react';
import { checkHotelRoomAvailability } from '../api/hotel';
import { useNavigate } from 'react-router-dom';
import { logUnifiedWhatsappIntent, saveCheckoutDraft } from '../api/reservation';
import { CONCIERGE_WHATSAPP } from '../lib/config';
import AvailabilityNotice from './AvailabilityNotice';

export default function BookModal({ 
  isOpen, 
  onClose, 
  roomData, 
  hotelData, 
  checkIn, 
  checkOut, 
  isLoggedIn = true,
  onDatesChange,
  onSignIn
}) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(1200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => { setBooked(false); setError(''); }, [checkIn, checkOut, roomData?._id]);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(1200); 
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !roomData || !hotelData) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();
  const totalPrice = roomData.pricePerNight * nights;

  const roomIsFree = async (from, to) => {
    const res = await checkHotelRoomAvailability(hotelData._id, roomData._id, { checkIn: from, checkOut: to });
    const flag = res?.data?.available ?? res?.available;
    return flag !== false;
  };

  const ensureAvailable = async () => {
    try {
      if (await roomIsFree(checkIn, checkOut)) return true;
      setBooked(true);
      return false;
    } catch {
      setError('Could not check availability. Please try again.');
      return false;
    }
  };

  const handleWhatsAppBooking = async () => {
    setError('');
    setIsProcessing(true);
    try {
      if (!(await ensureAvailable())) return;
      const response = await logUnifiedWhatsappIntent({
        assetId: hotelData._id,
        assetType: 'HOTEL',
        startDate: checkIn,
        endDate: checkOut,
        extraData: { roomId: roomData._id }
      });
      const reference = response?.data?.data?.reference || response?.data?.reference;
      if (!reference) throw new Error('No reference');
      const text = `Hello Rentals Africa Concierge! I would like to book a room.

*Hotel:* ${hotelData.title}
*Room:* ${roomData.name}
*Check-in:* ${checkIn}
*Check-out:* ${checkOut}
*Total Price:* ₦${totalPrice.toLocaleString()}
*Reference:* ${reference}

Please assist me with this reservation.`;
      window.open(`https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Could not start the WhatsApp booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstantBooking = async () => {
    setError('');
    setIsProcessing(true);
    try {
      if (!(await ensureAvailable())) return;
      const fmt = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      saveCheckoutDraft({
        kind: 'hotel',
        tag: 'Hotel',
        title: `${roomData.name} · ${hotelData.title}`,
        subtitle: [hotelData.address?.city, hotelData.address?.state].filter(Boolean).join(', ') || hotelData.location,
        image: roomData.image || hotelData.images?.[0],
        backTo: `/hotel/${hotelData._id}`,
        details: [
          { label: 'Check-in', value: fmt(checkIn) },
          { label: 'Check-out', value: fmt(checkOut) },
          { label: 'Guests', value: String(roomData.capacity?.adults || 1) },
        ],
        lines: [{ label: `₦${Number(roomData.pricePerNight).toLocaleString()} x ${nights} night${nights > 1 ? 's' : ''}`, amount: totalPrice }],
        total: totalPrice,
        payload: {
          propertyId: hotelData._id,
          roomId: roomData._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guestsCount: roomData.capacity?.adults || 1,
          totalAmount: totalPrice,
          bookingType: 'HOTEL',
        },
      });
      onClose?.();
      navigate('/checkout');
    } catch {
      setError('Could not continue to checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-brand-dark/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg bg-white rounded-3xl shadow-elevated overflow-hidden flex flex-col max-h-[90vh] animate-fade-up duration-300">
        
        <div className="bg-brand-dark p-7 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
           aria-label="Close">
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold tracking-tight">Rentals Concierge</h3>
              <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Secure Checkout</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-6 flex-grow hide-scrollbar">
          
          <div className="flex items-center justify-between bg-red-50 border border-red-100 p-3 rounded-xl mb-6">
            <div className="flex items-center text-red-700">
              <Clock className="w-5 h-5 mr-2 animate-pulse" />
              <span className="text-base font-semibold">Holding room for</span>
            </div>
            <span className="text-xl font-display font-bold text-red-700 tabular-nums tracking-tight">
              {timeString}
            </span>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6">
            <div className="flex space-x-4">
              <img 
                src={roomData.image || hotelData.images[0]} 
                alt={roomData.name} 
                className="w-24 h-24 object-cover rounded-xl shadow-sm"
              />
              <div className="flex flex-col justify-center">
                <h4 className="text-lg font-display font-bold text-brand-dark leading-tight mb-1">{roomData.name}</h4>
                <span className="flex items-center text-sm font-medium text-brand-text-secondary mb-1">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> {hotelData.title}
                </span>
                <span className="flex items-center text-sm font-medium text-brand-text-secondary">
                  <CalendarDays className="w-3.5 h-3.5 mr-1" /> {nights} {nights === 1 ? 'Night' : 'Nights'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-end">
              <span className="text-base font-semibold text-brand-text-secondary">Total Price</span>
              <span className="text-3xl font-display font-bold text-brand-dark">₦{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-start bg-green-50 border border-green-200 p-4 rounded-xl mb-6">
            <ShieldCheck className="w-6 h-6 text-green-700 mr-3 shrink-0" />
            <div>
              <h5 className="font-bold text-green-900 text-base mb-1">Payment Protection Active</h5>
              <p className="text-sm text-green-800 leading-relaxed">
                Your payment is held securely by Rentals Africa and the hotel is only paid after you check in. Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment.
              </p>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-base font-semibold text-brand-dark mb-3">Log in to complete your reservation</p>
              <button onClick={onSignIn} className="bg-brand-dark text-white font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-brand-accent transition-colors w-full">
                Sign In
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{error}</div>}
              {booked && (
                <AvailabilityNotice
                  start={checkIn}
                  end={checkOut}
                  isFree={roomIsFree}
                  onPick={(s, e) => { setBooked(false); onDatesChange?.(s, e); }}
                />
              )}
              <button 
                onClick={handleInstantBooking}
                disabled={isProcessing}
                className="w-full flex items-center justify-center bg-brand-primary text-white font-semibold text-lg py-4 rounded-xl hover:bg-brand-hover transition-all shadow-glow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {isProcessing ? "Checking availability..." : `Continue to checkout · ₦${totalPrice.toLocaleString()}`}
              </button>
              
              <WhatsAppCheckout onClick={handleWhatsAppBooking} loading={!!(isProcessing)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
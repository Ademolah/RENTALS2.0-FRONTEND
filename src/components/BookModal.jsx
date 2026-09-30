import React, { useState, useEffect } from 'react';
import { 
  X, Clock, ShieldCheck, CreditCard, MessageCircle, 
  CalendarDays, BedDouble, MapPin, CheckCircle2 
} from 'lucide-react';

export default function BookModal({ 
  isOpen, 
  onClose, 
  roomData, 
  hotelData, 
  checkIn, 
  checkOut, 
  isLoggedIn = true 
}) {
  // 1. ALL HOOKS MUST BE AT THE ABSOLUTE TOP
  const [timeLeft, setTimeLeft] = useState(1200);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(1200); // Reset when closed
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // 2. CONDITIONAL RETURN MUST BE AFTER ALL HOOKS
  if (!isOpen || !roomData || !hotelData) return null;

  // Format the countdown timer
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calculate nights and total 
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

  // Generate WhatsApp Message
  const handleWhatsAppBooking = () => {
    const text = `Hello Rentals Africa Concierge! I would like to book a room.
    
*Hotel:* ${hotelData.title}
*Room:* ${roomData.name}
*Check-in:* ${checkIn || 'TBD'}
*Check-out:* ${checkOut || 'TBD'}
*Total Price:* ₦${totalPrice.toLocaleString()}

Please assist me with the escrow payment.`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/2348000000000?text=${encodedText}`, '_blank');
  };

  const handleInstantBooking = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('rentals_token'); 
      
      const response = await fetch('http://localhost:8000/api/v1/reservations/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          propertyId: hotelData._id,
          roomId: roomData._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guestsCount: roomData.capacity.adults || 1,
          totalAmount: totalPrice,
          bookingType: 'HOTEL' 
        })
      });

      const data = await response.json();

      if (data.status === 'success' && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        console.error("Payment Error:", data);
        alert(data.message || "Failed to initialize payment.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("A network error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        
        <div className="bg-[#0A2540] p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Rentals Concierge</h3>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Secure Checkout</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-6 flex-grow hide-scrollbar">
          
          <div className="flex items-center justify-between bg-red-50 border border-red-100 p-3 rounded-xl mb-6">
            <div className="flex items-center text-red-700">
              <Clock className="w-5 h-5 mr-2 animate-pulse" />
              <span className="text-sm font-bold">Holding room for</span>
            </div>
            <span className="text-lg font-black text-red-700 tabular-nums tracking-tight">
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
                <h4 className="font-bold text-gray-900 leading-tight mb-1">{roomData.name}</h4>
                <span className="flex items-center text-xs font-medium text-gray-500 mb-1">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> {hotelData.title}
                </span>
                <span className="flex items-center text-xs font-medium text-gray-500">
                  <CalendarDays className="w-3.5 h-3.5 mr-1" /> {nights} {nights === 1 ? 'Night' : 'Nights'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-end">
              <span className="text-sm font-bold text-gray-500">Total Price</span>
              <span className="text-2xl font-black text-gray-900">₦{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-start bg-green-50 border border-green-200 p-4 rounded-xl mb-6">
            <ShieldCheck className="w-6 h-6 text-green-700 mr-3 shrink-0" />
            <div>
              <h5 className="font-bold text-green-900 text-sm mb-1">Escrow Protection Active</h5>
              <p className="text-xs text-green-800 leading-relaxed">
                Your payment is held securely by Rentals Africa. The hotel is only paid after you successfully check in. 100% money-back guarantee.
              </p>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-bold text-gray-900 mb-3">Log in to complete your reservation</p>
              <button className="bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-black transition-colors w-full">
                Sign In
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button 
                onClick={handleInstantBooking}
                disabled={isProcessing}
                className="w-full flex items-center justify-center bg-[#0A2540] text-white font-bold text-lg py-4 rounded-xl hover:bg-black transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {isProcessing ? "Processing..." : `Pay ₦${totalPrice.toLocaleString()} Instantly`}
              </button>
              
              <button 
                onClick={handleWhatsAppBooking}
                className="w-full flex items-center justify-center bg-white border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold text-lg py-3.5 rounded-xl transition-all active:scale-[0.98]"
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
          )}
        </div>
      </div>
    </div>
  );
}
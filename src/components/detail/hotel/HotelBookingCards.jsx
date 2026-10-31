import { CheckCircle2, CalendarDays, Info } from 'lucide-react';
import { WhatsAppCheckout } from '../../ui';
import CancellationNote from '../CancellationNote';

// Sticky booking card in the right column (desktop).
export function HotelBookingCard({ booking }) {
  const { isLoggedIn, totalPrice, nights, activeRoomData, handleBookClick, handleWhatsAppClick, isWhatsappLoading } = booking;
  return (
    <div className="sticky top-28 bg-white border border-gray-100 rounded-3xl p-7 shadow-elevated">
      <div className="mb-6 flex flex-col items-start border-b border-gray-100 pb-6">
        <div className="flex items-baseline space-x-1">
          <span className="text-4xl font-display font-bold text-brand-dark tracking-tight">
            ₦{totalPrice.toLocaleString()}
          </span>
          <span className="text-brand-text-secondary font-medium">total</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-green-700 mt-2 bg-green-50/80 px-2 py-1 rounded-md border border-green-100">
          Taxes & fees included
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 space-y-3">
        <div className="flex items-start text-base text-brand-dark">
          <CheckCircle2 className="w-4 h-4 text-brand-primary mr-2 mt-0.5 shrink-0" />
          <span>Suite: <strong>{activeRoomData?.name}</strong></span>
        </div>
        <div className="flex items-start text-base text-brand-dark">
          <CalendarDays className="w-4 h-4 text-brand-primary mr-2 mt-0.5 shrink-0" />
          <span>Duration: <strong>{nights} {nights === 1 ? 'night' : 'nights'}</strong></span>
        </div>
        <div className="flex items-start text-base text-brand-dark">
          <Info className="w-4 h-4 text-brand-text-muted mr-2 mt-0.5 shrink-0" />
          <span>You won't be charged yet.</span>
        </div>
      </div>

      <div className="space-y-3 relative z-0">
        <button
          onClick={handleBookClick}
          className="w-full bg-brand-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-brand-hover transition-all active:scale-[0.98] shadow-glow"
        >
          {isLoggedIn ? 'Reserve Now' : 'Login to Reserve'}
        </button>

        <WhatsAppCheckout onClick={handleWhatsAppClick} loading={!!isWhatsappLoading} />
        <CancellationNote className="mt-3 text-sm text-brand-text-secondary leading-snug" />
      </div>
    </div>
  );
}

// Booking card shown under the content on small screens.
export function HotelMobileBookingCard({ booking }) {
  const { isLoggedIn, totalPrice, handleBookClick, handleWhatsAppClick, isWhatsappLoading } = booking;
  return (
    <div className="lg:hidden mx-4 my-8 bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-bold text-green-700 uppercase tracking-widest bg-green-50 px-2 py-1 rounded">Taxes incl.</span>
        <span className="text-2xl font-display font-bold text-brand-dark tracking-tight">₦{totalPrice.toLocaleString()}</span>
      </div>
      <button
        onClick={handleBookClick}
        className="w-full bg-brand-primary text-white text-lg font-bold px-6 py-4 rounded-2xl hover:opacity-90 transition-transform active:scale-[0.99] shadow-lg shadow-brand-primary/20"
      >
        {isLoggedIn ? 'Reserve' : 'Login'}
      </button>
      <WhatsAppCheckout onClick={handleWhatsAppClick} loading={!!isWhatsappLoading} />
      <CancellationNote className="mt-3 text-sm text-brand-text-secondary leading-snug" />
    </div>
  );
}

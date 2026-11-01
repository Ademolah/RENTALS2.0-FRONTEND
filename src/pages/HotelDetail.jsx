import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
// Icons via Font Awesome CDN (index.html) — no lucide-react
import { getHotelById, bookHotel } from '../api/hotels';
import { initiateWhatsAppBooking, openWhatsApp } from '../api/whatsapp';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => Number(n || 0).toLocaleString();
const today = new Date().toISOString().split('T')[0];

export default function HotelDetail() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();
  const mobileRef = useRef(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');

  const scrollGallery = (ref, dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir === 'left' ? -ref.current.offsetWidth : ref.current.offsetWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    getHotelById(id)
      .then(res => setHotel(res?.data?.hotel || res?.hotel || res?.data || res))
      .catch(() => setHotel(null))
      .finally(() => setLoading(false));
  }, [id]);

  const nights = (checkIn && checkOut) ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 0;
  const total = nights * (hotel?.pricePerNight || hotel?.price || 0);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookError('');
    if (!user) { openAuthModal(); return; }
    if (nights <= 0) { setBookError('Please select valid check-in and check-out dates.'); return; }
    setBookLoading(true);
    try {
      const res = await bookHotel({ hotelId: id, checkInDate: checkIn, checkOutDate: checkOut, guests, totalAmount: total });
      const url = res?.data?.checkoutUrl || res?.checkoutUrl || res?.authorization_url;
      if (url) window.location.href = url;
      else setBookError('Reservation secured, but could not redirect to payment.');
    } catch (err) {
      setBookError(err.response?.data?.message || 'Reservation failed. Please try again.');
    } finally {
      setBookLoading(false);
    }
  };

  const handleWhatsApp = async () => {
    setBookError('');
    if (!checkIn || !checkOut) { setBookError('Please select dates first.'); return; }
    try {
      const res = await initiateWhatsAppBooking({ listingId: id, type: 'hotel', checkInDate: checkIn, checkOutDate: checkOut, guests });
      openWhatsApp(res?.data?.reference || res?.reference || '', hotel, {
        dates: `${new Date(checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → ${new Date(checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
        guests: `${guests} guest(s)`,
        price: total ? `₦${fmt(total)}` : '',
      });
    } catch {
      openWhatsApp('', hotel, { dates: `${checkIn} → ${checkOut}`, guests: `${guests} guest(s)` });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <i className="fa-solid fa-spinner fa-spin text-3xl text-brand-primary mb-4" />
      <p className="text-gray-500 font-medium">Preparing hotel details...</p>
    </div>
  );

  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Hotel not found or no longer available.
    </div>
  );

  const images = hotel.images?.length > 0 ? hotel.images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'];
  const price = hotel.pricePerNight || hotel.price || 0;

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/" className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-brand-dark mb-4 transition-colors">
        <i className="fa-solid fa-arrow-left text-sm" />
        <span>Back to listings</span>
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">{hotel.title || hotel.name}</h1>
          <div className="flex items-center space-x-4 text-sm text-brand-dark font-medium">
            <span className="underline cursor-pointer">{typeof hotel.address === 'object' ? `${hotel.address?.city}, ${hotel.address?.state}` : hotel.address}</span>
            {hotel.isVerified && (
              <span className="flex items-center space-x-1 text-brand-primary">
                <span className="bg-brand-primary text-white px-1.5 py-0.5 rounded text-[10px] font-bold">R</span>
                <span>Verified</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-4 text-sm font-medium underline">
          <button className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
            <i className="fa-solid fa-share-nodes text-sm" /><span>Share</span>
          </button>
          <button className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
            <i className="fa-regular fa-heart text-sm" /><span>Save</span>
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="mb-10">
        <div className="md:hidden relative h-[300px] rounded-2xl overflow-hidden">
          <div ref={mobileRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
            {images.map((img, i) => (
              <div key={i} className="w-full h-full flex-shrink-0 snap-center relative">
                <img src={img} className="absolute inset-0 w-full h-full object-cover" alt={`View ${i + 1}`} />
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <>
              <button onClick={() => scrollGallery(mobileRef, 'left')} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-md z-10"><i className="fa-solid fa-chevron-left text-base" /></button>
              <button onClick={() => scrollGallery(mobileRef, 'right')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-md z-10"><i className="fa-solid fa-chevron-right text-base" /></button>
            </>
          )}
        </div>
        <div className="hidden md:block h-[480px] rounded-2xl overflow-hidden">
          <img src={images[0]} className="w-full h-full object-cover" alt="Main view" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left */}
        <div className="lg:col-span-7 space-y-8">
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-xl font-bold text-brand-dark mb-4">Hotel hosted by Rentals Africa</h2>
            {hotel.description && <p className="text-gray-600 leading-relaxed">{hotel.description}</p>}
          </div>
          {hotel.amenities?.length > 0 && (
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-brand-dark mb-4">What this hotel offers</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {hotel.amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <i className="fa-solid fa-star text-sm text-brand-primary shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hotel.rating && (
            <div className="flex items-center gap-2 text-brand-dark">
              <i className="fa-solid fa-star text-base text-brand-dark" />
              <span className="font-bold">{hotel.rating}</span>
              <span className="text-gray-500 text-sm">· reviews</span>
            </div>
          )}
        </div>

        {/* Right: Booking Widget */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-baseline justify-between mb-6">
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-gray-900">₦{fmt(price)}</span>
                <span className="text-gray-500 text-sm font-medium">/ night</span>
              </div>
              {hotel.rating && (
                <div className="flex items-center space-x-1">
                  <i className="fa-solid fa-star text-sm text-gray-900" />
                  <span className="font-semibold text-sm text-gray-900">{hotel.rating}</span>
                </div>
              )}
            </div>

            {bookError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{bookError}</div>
            )}

            <form onSubmit={handleBook} className="space-y-4">
              <div className="border border-gray-300 rounded-2xl overflow-hidden">
                <div className="flex border-b border-gray-300">
                  <div className="flex-1 p-3 border-r border-gray-300">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block">Check-in</label>
                    <input type="date" required min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full text-sm outline-none bg-transparent font-medium mt-1 cursor-pointer text-gray-900" />
                  </div>
                  <div className="flex-1 p-3">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block">Check-out</label>
                    <input type="date" required min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full text-sm outline-none bg-transparent font-medium mt-1 cursor-pointer text-gray-900" />
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block">Guests</label>
                    <span className="text-xs text-gray-500 font-medium">Max {hotel.maxGuests || 10}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))} disabled={guests <= 1} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 transition-colors">
                      <i className="fa-solid fa-minus text-sm" />
                    </button>
                    <span className="font-semibold text-gray-900 w-4 text-center">{guests}</span>
                    <button type="button" onClick={() => setGuests(g => Math.min(hotel.maxGuests || 10, g + 1))} disabled={guests >= (hotel.maxGuests || 10)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 transition-colors">
                      <i className="fa-solid fa-plus text-sm" />
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={bookLoading} className="w-full py-4 bg-gray-900 hover:bg-brand-primary text-white rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center disabled:opacity-70 active:scale-95 duration-200">
                {bookLoading ? <><i className="fa-solid fa-spinner fa-spin text-base mr-2" /><span>Securing...</span></> : 'Reserve Now'}
              </button>

              <button type="button" onClick={handleWhatsApp} className="w-full py-4 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center gap-2">
                <i className="fa-brands fa-whatsapp text-base" />
                Book via WhatsApp instead
              </button>
            </form>

            <div className="flex items-center justify-center space-x-2 text-gray-500 mt-4 mb-2">
              <i className="fa-solid fa-shield-halved text-sm text-emerald-600" />
              <span className="text-xs font-medium">Secure Booking</span>
            </div>

            {nights > 0 && (
              <div className="space-y-3 pt-5 mt-5 border-t border-gray-100">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>₦{fmt(price)} × {nights} night{nights === 1 ? '' : 's'}</span>
                  <span>₦{fmt(total)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>₦{fmt(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

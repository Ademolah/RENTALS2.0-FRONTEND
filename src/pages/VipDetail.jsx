import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// Icons via Font Awesome CDN (index.html) — no lucide-react
import { getVipEstablishmentById as getVipVenueById } from '../api/vip';
import { initiateWhatsAppBooking, openWhatsApp } from '../api/whatsapp';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => Number(n || 0).toLocaleString();

export default function VipDetail() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('18:00');
  const [partySize, setPartySize] = useState(10);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getVipVenueById(id)
      .then(res => setVenue(res?.data?.venue || res?.venue || res?.data || res))
      .catch(() => setVenue(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWhatsApp = async () => {
    setBookError('');
    if (!user) { openAuthModal(); return; }
    if (!date) { setBookError('Please select a date.'); return; }
    setBooking(true);
    try {
      const res = await initiateWhatsAppBooking({
        listingId: id,
        type: 'vip',
        date,
        arrivalTime,
        partySize,
      });
      const ref = res?.data?.reference || res?.reference || '';
      openWhatsApp(ref, venue, {
        dates: new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
        guests: `${partySize} guests`,
        price: venue?.price ? `₦${fmt(venue.price)}` : '',
      });
    } catch {
      // fallback: open WhatsApp without a reference
      openWhatsApp('', venue, { dates: date, guests: `${partySize} guests` });
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <i className="fa-solid fa-spinner fa-spin text-3xl text-brand-primary mb-4" />
      <p className="text-gray-500 font-medium">Loading venue details...</p>
    </div>
  );

  if (!venue) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Venue not found or is no longer available.
    </div>
  );

  const images = venue.images?.length > 0 ? venue.images : ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'];

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/" className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-brand-dark mb-4 transition-colors">
        <i className="fa-solid fa-arrow-left text-sm" />
        <span>Back to listings</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-xs font-bold tracking-widest text-brand-primary uppercase mb-2">
          <span>VIP Reservation</span>
          {venue.location && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 flex items-center">
                <i className="fa-solid fa-location-dot text-xs mr-1" />
                {typeof venue.location === 'string' ? venue.location : `${venue.location?.city}, ${venue.location?.state}`}
              </span>
            </>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{venue.title || venue.name}</h1>
      </div>

      {/* Image */}
      <div className="h-[380px] rounded-2xl overflow-hidden mb-10">
        <img src={images[0]} alt={venue.title} className="w-full h-full object-cover" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">About this venue</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{venue.description || 'A premium VIP venue managed exclusively by Rentals Africa.'}</p>
          </div>

          {venue.capacity && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <i className="fa-solid fa-users text-base text-gray-500" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Capacity</p>
                <p className="font-semibold text-gray-900">{venue.capacity} guests</p>
              </div>
            </div>
          )}

          {venue.amenities?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Amenities</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {venue.amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <i className="fa-solid fa-star text-sm text-brand-primary shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] sticky top-28">
            <div className="flex items-baseline gap-1 mb-6 pb-5 border-b border-gray-100">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                ₦{fmt(venue.price)}
              </span>
              <span className="text-gray-500 text-sm font-medium">/ event</span>
            </div>

            {bookError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{bookError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block mb-1">Event Date</label>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={e => setArrivalTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-900 block mb-1">Party Size</label>
                <input
                  type="number"
                  min={1}
                  max={venue.capacity || 500}
                  value={partySize}
                  onChange={e => setPartySize(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <button
                onClick={handleWhatsApp}
                disabled={booking}
                className="w-full py-4 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {booking ? <i className="fa-solid fa-spinner fa-spin text-base" /> : <i className="fa-brands fa-whatsapp text-base" />}
                {booking ? 'Opening WhatsApp...' : 'Enquire via WhatsApp'}
              </button>
            </div>

            <div className="flex items-center justify-center space-x-2 text-gray-500 mt-4">
              <i className="fa-solid fa-shield-halved text-sm text-emerald-600" />
              <span className="text-xs font-medium">Managed by Rentals Africa</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

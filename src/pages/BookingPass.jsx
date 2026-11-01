import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

function QRCode({ value, size = 200 }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    // Use the Google Charts API to generate a QR code image
    const encoded = encodeURIComponent(value);
    setSrc(`https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encoded}&choe=UTF-8`);
  }, [value, size]);
  return src
    ? <img src={src} alt="Check-in QR code" className="w-full h-full object-contain" />
    : <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fa-solid fa-qrcode text-6xl" /></div>;
}

export default function BookingPass() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        let res;
        try {
          const r = await apiClient.get(`/reservations/${id}`);
          res = r.data?.data?.reservation || r.data?.reservation || r.data;
        } catch {
          const r = await apiClient.get(`/cars/bookings/${id}`);
          res = r.data?.data?.booking || r.data?.booking || r.data;
        }
        setBooking(res);
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <i className="fa-solid fa-spinner fa-spin text-3xl text-brand-primary" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <i className="fa-solid fa-circle-exclamation text-4xl text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Pass not available</h2>
      <p className="text-gray-500 mb-6">This booking pass could not be loaded.</p>
      <Link to="/dashboard/guest" className="px-6 py-3 bg-gray-900 text-white rounded-full font-semibold text-sm">Back to trips</Link>
    </div>
  );

  const b = booking;
  const passValue = JSON.stringify({ bookingId: id, ref: b.reference, status: b.status });

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-amber-400 text-[10px] font-extrabold uppercase tracking-[0.25em] mb-2">Rentals Africa</p>
          <h1 className="text-white text-2xl font-black">Check-in Pass</h1>
        </div>

        {/* Pass card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {b.image && (
            <div className="h-40 relative">
              <img src={b.image} alt={b.listingTitle} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className="p-6">
            <h2 className="text-xl font-black text-gray-900 leading-tight mb-1">{b.listingTitle || b.title || 'Your Booking'}</h2>
            {b.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                <i className="fa-solid fa-location-dot text-sm" />
                {typeof b.location === 'string' ? b.location : `${b.location?.city}, ${b.location?.state}`}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-5 py-4 border-y border-gray-100">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-1">Check-in</p>
                <p className="font-bold text-gray-900 text-sm">{fmt(b.checkInDate || b.startDate || b.pickupTime)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-1">Check-out</p>
                <p className="font-bold text-gray-900 text-sm">{fmt(b.checkOutDate || b.endDate || b.returnTime)}</p>
              </div>
            </div>

            {b.reference && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-1">Booking Reference</p>
                <p className="font-black text-gray-900 text-lg font-mono tracking-widest">{b.reference}</p>
              </div>
            )}

            {/* QR Code */}
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-2xl mb-4">
              <div className="w-44 h-44">
                <QRCode value={passValue} size={176} />
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              Show this pass to the Rentals Africa team upon arrival. Your booking is secured.
            </p>
          </div>

          {/* Footer strip */}
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
            <span className="text-white text-xs font-bold uppercase tracking-widest">Rentals Africa</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${b.status === 'PAID' || b.status === 'CONFIRMED' ? 'bg-emerald-400 text-gray-900' : 'bg-gray-700 text-white'}`}>
              {b.status}
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Link to={`/bookings/${id}`} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-sm transition-colors flex items-center gap-2">
            <i className="fa-solid fa-arrow-left text-sm" />
            Back to booking
          </Link>
          <button onClick={() => window.print()} className="px-6 py-3 bg-white text-gray-900 rounded-2xl font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
            <i className="fa-solid fa-download text-sm" />
            Save pass
          </button>
        </div>
      </div>
    </main>
  );
}

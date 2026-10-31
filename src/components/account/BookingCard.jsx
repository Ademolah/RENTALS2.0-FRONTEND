import { MapPin, Calendar } from 'lucide-react';
import { statusBadge } from './statusBadge';

const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BookingCard({ booking, onOpen }) {
  const showEnd = booking.end && booking.type !== 'VIP' && booking.type !== 'VIP_SERVICE';
  return (
    <button
      type="button"
      onClick={() => onOpen(booking)}
      className={`w-full text-left bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-card-hover transition-all flex flex-col sm:flex-row overflow-hidden ${booking.cancelled ? 'opacity-75' : ''}`}
    >
      <img src={booking.image} alt={booking.title} loading="lazy" className="sm:w-56 h-44 sm:h-auto object-cover bg-gray-100" />
      <div className="flex-1 p-5 md:p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-text-muted">{booking.typeLabel} · {booking.reference}</p>
            <h3 className="text-xl font-display font-bold text-brand-dark mt-1 truncate">{booking.title}</h3>
          </div>
          {statusBadge(booking)}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-base text-brand-text-secondary">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{booking.location}</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {fmt(booking.start)}{showEnd ? ` – ${fmt(booking.end)}` : ''}
          </span>
        </div>
        <p className="text-xl font-display font-bold text-brand-dark mt-auto">₦{booking.total.toLocaleString()}</p>
      </div>
    </button>
  );
}

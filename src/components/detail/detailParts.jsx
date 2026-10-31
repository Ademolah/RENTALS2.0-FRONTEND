import { LogIn, LogOut, Moon, CalendarDays, Navigation, Settings2 } from 'lucide-react';
import { Card, Button } from '../ui';
import { timeText, directionsUrl } from './detailUtils';

const isTime = (t) => typeof t === 'string' && /^\d{1,2}:\d{2}/.test(t);

const naira = (n) => `₦${Math.round(n).toLocaleString()}`;

// Check-in/out times, stay length and longer-stay hint (mirrors the mobile listing screen).
export function StayFacts({ checkInTime, checkOutTime, price, nightly = true }) {
  const rows = [];
  if (isTime(checkInTime)) rows.push([LogIn, `Check-in after ${timeText(checkInTime)}`]);
  if (isTime(checkOutTime)) rows.push([LogOut, `Check-out before ${timeText(checkOutTime)}`]);
  if (nightly) rows.push([Moon, 'Book from 1 night, no maximum stay']);
  if (nightly && Number(price) > 0) {
    rows.push([CalendarDays, `Longer stays: about ${naira(price * 7)} a week, ${naira(price * 30)} a month`]);
  }
  if (rows.length === 0) return null;
  return (
    <section className="pb-10 border-b border-gray-100">
      <h3 className="text-2xl font-display font-bold text-brand-dark mb-6">Stay details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map(([Icon, text]) => (
          <div key={text} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white">
            <div className="w-11 h-11 rounded-xl bg-brand-accent-soft flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-brand-accent" />
            </div>
            <span className="text-base font-medium text-brand-dark">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DirectionsLink({ lat, lng, address, className = '' }) {
  if (!address && (lat === undefined || lat === null)) return null;
  return (
    <a
      href={directionsUrl({ lat, lng, address })}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 text-base font-semibold text-brand-primary hover:text-brand-hover ${className}`}
    >
      <Navigation className="w-5 h-5" /> Get directions
    </a>
  );
}

export function ManageListingCard({ status, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-brand-accent-soft text-brand-accent flex items-center justify-center mb-4">
        <Settings2 className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-display font-bold text-brand-dark">This is your listing</h3>
      <p className="mt-2 text-base text-brand-text-secondary leading-relaxed">
        {status === 'pending'
          ? 'It is under review and goes live after verification (24 to 48 hours).'
          : status === 'rejected'
            ? 'It needs changes before it can go live. Open your dashboard to see why.'
            : 'You see the guest view of your listing here. Edit details, pause it or check bookings from your dashboard.'}
      </p>
      <Button to="/dashboard/landlord" className="mt-5 w-full">Manage listing</Button>
    </Card>
  );
}

export function PhotoCount({ current, total, className = '' }) {
  if (!total) return null;
  return (
    <div className={`bg-brand-dark/70 backdrop-blur-md text-white text-sm font-semibold px-3 py-1 rounded-full pointer-events-none ${className}`}>
      {current} / {total}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarX } from 'lucide-react';
import { AccountShell, ListSkeleton, ErrorBox } from '../components/account/AccountShell';
import BookingCard from '../components/account/BookingCard';
import BookingDetail from '../components/account/BookingDetail';
import { Card, EmptyState, Button } from '../components/ui';
import { fetchGuestBookings } from '../api/trips';
import { useDocumentMeta } from '../lib/seo';

const TABS = [
  { id: 'upcoming', label: 'Upcoming', empty: 'No upcoming trips', hint: 'When you book a stay, car or VIP experience it will show here.' },
  { id: 'past', label: 'Past', empty: 'No past trips yet', hint: 'Completed trips appear here, where you can leave a review.' },
  { id: 'cancelled', label: 'Cancelled', empty: 'No cancelled bookings', hint: 'Bookings you cancel will be listed here.' },
];

export default function Trips() {
  useDocumentMeta('My trips', 'Your upcoming, past and cancelled bookings on Rentals Africa.');
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(() => {
    setError(false);
    setBookings(null);
    fetchGuestBookings().then(setBookings).catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (localStorage.getItem('rentals_token')) load();
    else setBookings([]);
  }, [load]);

  const counts = useMemo(() => {
    const c = { upcoming: 0, past: 0, cancelled: 0 };
    (bookings || []).forEach((b) => { c[b.bucket] += 1; });
    return c;
  }, [bookings]);

  const visible = (bookings || []).filter((b) => b.bucket === tab);
  const selected = bookings?.find((b) => b.id === openId);

  const applyChange = (id, patch) => setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const current = TABS.find((t) => t.id === tab);

  return (
    <AccountShell title="My trips" subtitle="Every booking in one place: stays, hotels, cars and VIP.">
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 rounded-full text-base font-semibold whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-brand-text-secondary hover:text-brand-dark'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-sm ${tab === t.id ? 'text-white/70' : 'text-brand-text-muted'}`}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {error ? (
        <ErrorBox message="We could not load your trips." onRetry={load} />
      ) : bookings === null ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarX}
            title={current.empty}
            text={current.hint}
            action={tab === 'upcoming' ? <Button to="/">Start exploring</Button> : null}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map((b) => <BookingCard key={b.id} booking={b} onOpen={(x) => setOpenId(x.id)} />)}
        </div>
      )}

      {selected && <BookingDetail booking={selected} onClose={() => setOpenId(null)} onChange={applyChange} />}
    </AccountShell>
  );
}

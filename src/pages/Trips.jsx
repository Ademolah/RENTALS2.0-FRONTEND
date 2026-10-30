import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import { AccountShell, ListSkeleton, ErrorBox } from '../components/account/AccountShell';
import BookingCard from '../components/account/BookingCard';
import BookingDetail from '../components/account/BookingDetail';
import { Card, EmptyState, Button } from '../components/ui';
import { fetchGuestBookings } from '../api/trips';
import { useDocumentMeta } from '../lib/seo';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'SHORTLET', label: 'Shortlets', types: ['SHORTLET'] },
  { id: 'HOTEL', label: 'Hotels', types: ['HOTEL'] },
  { id: 'CAR', label: 'Cars', types: ['CAR'] },
  { id: 'VIP', label: 'VIP', types: ['VIP', 'VIP_SERVICE'] },
];

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
  const [category, setCategory] = useState('all');
  const [params, setParams] = useSearchParams();

  const load = useCallback(() => {
    setError(false);
    setBookings(null);
    fetchGuestBookings().then(setBookings).catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (localStorage.getItem('rentals_token')) load();
    else setBookings([]);
  }, [load]);

  const inCategory = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === category);
    return (bookings || []).filter((b) => !cat.types || cat.types.includes(b.type));
  }, [bookings, category]);

  const counts = useMemo(() => {
    const c = { upcoming: 0, past: 0, cancelled: 0 };
    inCategory.forEach((b) => { c[b.bucket] += 1; });
    return c;
  }, [inCategory]);

  const visible = inCategory.filter((b) => b.bucket === tab);

  const wanted = params.get('booking');
  useEffect(() => {
    if (!wanted || !bookings) return;
    const match = bookings.find((b) => b.id === wanted);
    if (match) {
      setCategory('all');
      setTab(match.bucket);
      setOpenId(match.id);
    }
    const next = new URLSearchParams(params);
    next.delete('booking');
    setParams(next, { replace: true });
  }, [wanted, bookings]); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = bookings?.find((b) => b.id === openId);

  const applyChange = (id, patch) => setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const current = TABS.find((t) => t.id === tab);

  return (
    <AccountShell title="My trips" subtitle="Every booking in one place: stays, hotels, cars and VIP.">
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar" aria-label="Filter by type">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            aria-pressed={category === c.id}
            className={`px-4 py-2 rounded-full text-base font-medium whitespace-nowrap transition-all border ${
              category === c.id ? 'bg-brand-primary-soft text-brand-dark border-brand-primary' : 'bg-white border-gray-200 text-brand-text-secondary hover:text-brand-dark'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

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

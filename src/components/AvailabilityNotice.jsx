import { useState } from 'react';
import { CalendarSearch, Loader2 } from 'lucide-react';
import { findNearbyWindows, formatShort } from '../lib/availability';

export default function AvailabilityNotice({ start, end, bookedDates, isFree, onPick }) {
  const [loading, setLoading] = useState(false);
  const [windows, setWindows] = useState(null);

  const run = async () => {
    setLoading(true);
    try {
      setWindows(await findNearbyWindows({ start, end, bookedDates, isFree }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-brand-warning-soft border border-brand-warning/20">
      <p className="text-base font-semibold text-brand-dark">These dates have been booked.</p>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-dark text-white text-sm font-semibold hover:bg-brand-accent disabled:opacity-70"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarSearch className="w-4 h-4" />}
        Check availability
      </button>
      {windows && (
        windows.length === 0 ? (
          <p className="mt-3 text-sm text-brand-text-secondary">No nearby dates are free. Try a different week.</p>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-brand-text-secondary mb-2">Available dates you can pick:</p>
            <div className="flex flex-wrap gap-2">
              {windows.map((w) => (
                <button
                  key={w.start}
                  type="button"
                  onClick={() => onPick(w.start, w.end)}
                  className="px-3 py-2 rounded-full border-2 border-brand-primary bg-white text-sm font-semibold text-brand-dark hover:bg-brand-primary-soft"
                >
                  {formatShort(w.start)} – {formatShort(w.end)}
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

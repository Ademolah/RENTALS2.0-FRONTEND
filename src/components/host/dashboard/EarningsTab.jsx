import { Loader2, BarChart3 } from 'lucide-react';
import { Button, Card, EmptyState, SectionTitle } from '../../ui';

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function MonthlyChart({ months }) {
  const max = Math.max(...months.map((m) => m.totalEarnings), 1);
  return (
    <Card className="p-6">
      <h3 className="text-lg font-display font-bold text-brand-dark mb-6">Monthly earnings</h3>
      <div className="flex items-end gap-2 h-56">
        {months.map((m) => (
          <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full gap-2" title={`₦${m.totalEarnings.toLocaleString()} · ${m.bookings} bookings`}>
            <div className="w-full rounded-t-lg bg-brand-primary/80 hover:bg-brand-primary transition-colors" style={{ height: `${Math.max((m.totalEarnings / max) * 100, m.totalEarnings > 0 ? 4 : 1)}%` }} />
            <span className="text-sm font-semibold text-brand-text-muted">{MONTH_INITIALS[m.month - 1]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function EarningsTab({ analytics, status, onRetry }) {
  return (
    <div>
      <SectionTitle title="Earnings" subtitle={analytics ? `Your payouts for ${analytics.year}, after the 5% platform commission.` : 'Your payouts for this year.'} />
      {status === 'loading' ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
      ) : status === 'error' ? (
        <Card>
          <EmptyState icon={BarChart3} title="Earnings unavailable" text="We could not load your earnings right now." action={<Button variant="dark" onClick={onRetry}>Try again</Button>} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              ['Total earnings', analytics.summary.totalEarnings, true],
              ['Paid out', analytics.summary.completedPayouts, true],
              ['Pending payouts', analytics.summary.pendingPayouts, true],
              ['Bookings', analytics.summary.totalBookings, false],
            ].map(([label, value, money]) => (
              <Card key={label} className="p-5">
                <p className="text-sm font-semibold text-brand-text-secondary">{label}</p>
                <p className="text-2xl font-display font-bold text-brand-dark mt-1">{money ? `₦${value.toLocaleString()}` : value}</p>
              </Card>
            ))}
          </div>
          <MonthlyChart months={analytics.months} />
        </div>
      )}
    </div>
  );
}

import { Banknote } from 'lucide-react';
import { Button, Card, EmptyState, SectionTitle } from '../../ui';
import PayoutActionCard from '../../PayoutActionCard';
import { typeLabel } from './constants';

export default function PayoutsTab({ rows, onReleased, onNeedBank }) {
  return (
    <div>
      <SectionTitle title="Payouts" subtitle="Your payout is 95% of each booking once check-in is confirmed by both sides." />
      {rows.length === 0 ? (
        <Card><EmptyState icon={Banknote} title="No payouts yet" text="Paid reservations on your listings will appear here." action={<Button variant="dark" onClick={onNeedBank}>Set up payout account</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {rows.map((b) => (
            <PayoutActionCard key={b._id} booking={b} typeLabel={typeLabel(b.type)} onReleased={onReleased} onNeedBank={onNeedBank} />
          ))}
        </div>
      )}
    </div>
  );
}

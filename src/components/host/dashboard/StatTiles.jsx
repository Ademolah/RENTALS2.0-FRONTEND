import { Building, Clock, CheckCircle, CalendarCheck } from 'lucide-react';
import { Card } from '../../ui';

function Tile({ icon: Icon, tint, iconColor, label, value }) {
  return (
    <Card className="p-5 md:p-6 flex items-center gap-4">
      <div className={`w-12 h-12 md:w-14 md:h-14 ${tint} rounded-2xl flex items-center justify-center shrink-0`}><Icon className={`w-6 h-6 md:w-7 md:h-7 ${iconColor}`} /></div>
      <div>
        <p className="text-sm font-semibold text-brand-text-secondary">{label}</p>
        <h3 className="text-2xl md:text-3xl font-display font-bold text-brand-dark tracking-tight">{value}</h3>
      </div>
    </Card>
  );
}

export default function StatTiles({ total, pending, approved, arriving }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Tile icon={Building} tint="bg-brand-accent-soft" iconColor="text-brand-accent" label="Your listings" value={total} />
      <Tile icon={Clock} tint="bg-brand-warning-soft" iconColor="text-brand-warning" label="Waiting for approval" value={pending} />
      <Tile icon={CheckCircle} tint="bg-status-available-soft" iconColor="text-status-available" label="Approved" value={approved} />
      <Tile icon={CalendarCheck} tint="bg-brand-warning-soft" iconColor="text-brand-warning" label="Arriving today" value={arriving} />
    </div>
  );
}

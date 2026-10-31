import { Link } from 'react-router-dom';
import { Clock, MapPin, Loader2, Eye, EyeOff, ExternalLink, BedDouble } from 'lucide-react';
import { Badge, Button, Card } from '../../ui';
import { STATUS_BADGE, typeLabel, viewAsGuestPath } from './constants';

export default function ListingCard({ listing: l, stats, toggling, onEdit, onEditRooms, onToggle }) {
  const st = STATUS_BADGE[l.status] || STATUS_BADGE.active;
  const canToggle = (l.status === 'active' || l.status === 'paused') && l.type !== 'VIP_SERVICE';

  return (
    <Card className="group overflow-hidden hover:shadow-card-hover transition-shadow">
      <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
        <img src={l.image} alt={l.title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${l.status === 'paused' ? 'grayscale opacity-70' : ''}`} />
        <Badge tone={st.tone} className="absolute top-3 left-3 bg-white/95">{st.label}</Badge>
        <Badge tone={l.type === 'VIP_SERVICE' ? 'amber' : 'gray'} className="absolute top-3 right-3 bg-white/90">{typeLabel(l.type)}</Badge>
      </div>
      <div className="p-5">
        <h4 className="text-lg font-display font-bold text-brand-dark leading-tight mb-1 truncate">{l.title}</h4>
        <div className="flex items-center text-brand-text-secondary text-base mb-2">
          <MapPin className="w-4 h-4 mr-1.5 text-brand-text-muted shrink-0" /> <span className="truncate">{l.location}</span>
        </div>
        {l.price > 0 && <p className="text-base font-display font-bold text-brand-dark mb-1">₦{l.price.toLocaleString()}</p>}
        <p className="text-sm text-brand-text-secondary mb-4">{stats.count} paid booking{stats.count === 1 ? '' : 's'} · ₦{stats.earned.toLocaleString()} earned</p>

        {l.status === 'pending' && (
          <div className="rounded-xl bg-brand-warning-soft border border-brand-warning/30 p-4 text-base text-brand-text-secondary flex gap-3">
            <Clock className="w-5 h-5 text-brand-warning shrink-0 mt-0.5" />
            <p>Waiting for admin approval. This listing goes live and becomes visible to guests once Rentals Africa approves it.</p>
          </div>
        )}
        {l.status !== 'pending' && (
          <div className="flex gap-2 mb-2">
            <Link to={viewAsGuestPath(l)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-brand-dark hover:border-brand-dark transition-colors">
              <ExternalLink className="w-4 h-4" /> View as guest
            </Link>
            {l.type === 'HOTEL' && (
              <Button variant="outline" size="sm" onClick={() => onEditRooms(l)} className="flex-1"><BedDouble className="w-4 h-4" /> Rooms</Button>
            )}
          </div>
        )}
        {!l.local && (
          <div className="flex gap-2 mt-2">
            <Button variant="soft" size="sm" onClick={() => onEdit(l)} className="flex-1">Edit</Button>
            {canToggle && (
              <Button variant="outline" size="sm" disabled={toggling} onClick={() => onToggle(l)} className="flex-1">
                {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : l.status === 'paused' ? <><Eye className="w-4 h-4" /> Make available</> : <><EyeOff className="w-4 h-4" /> Mark unavailable</>}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

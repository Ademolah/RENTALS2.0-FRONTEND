import { MapPin } from 'lucide-react';
import { WhatsAppPill } from '../../ui';
import ShareButton from '../../ShareButton';

export default function CarHeader({ car }) {
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 text-sm font-bold tracking-widest text-brand-primary uppercase mb-3">
        <span>{car.category || 'Premium Vehicle'}</span>
        <span className="text-gray-300">|</span>
        <span className="text-brand-text-secondary flex items-center"><MapPin className="w-4 h-4 mr-1" /> {car.location?.city}, {car.location?.state}</span>
      </div>
      <h1 className="text-4xl md:text-6xl font-display font-bold text-brand-dark tracking-tight leading-[1.05]">
        {car.make} {car.model} <span className="text-brand-text-muted font-medium ml-2">{car.year}</span>
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-3"><ShareButton /><WhatsAppPill /></div>
      <p className="mt-3 text-base font-medium text-brand-text-secondary">Managed by Rentals Africa</p>
    </div>
  );
}

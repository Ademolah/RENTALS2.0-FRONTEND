import { MapPin, Users, Settings2, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CarCard({ car }) {
  const make = car.make || 'Unknown Make';
  const model = car.carModel || 'Model';
  const price = Number(car.pricePer12Hours || car.price || 0);
  const image = car.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80';

  return (
    <Link to={`/cars/${car._id}`} className="group block rounded-2xl transition-all duration-300">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-3 bg-gray-100">
        <img
          src={image}
          alt={`${make} ${model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute top-3 left-3 px-2 py-1 bg-white/95 backdrop-blur-sm shadow-sm rounded-lg flex items-center space-x-1">
          <span className="text-brand-primary font-display font-bold text-sm leading-none">R</span>
          <span className="text-[9px] font-bold text-brand-dark uppercase tracking-wider">Verified</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col px-0.5">
        <h3 className="text-base font-display font-bold text-brand-dark truncate">
          {make} {model} <span className="text-brand-text-muted text-sm font-medium ml-1">{car.year}</span>
        </h3>

        <div className="flex items-center text-brand-text-secondary text-sm mt-1">
          <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
          <span className="truncate">{car.location?.city || 'Lagos'}, {car.location?.state || 'LA'}</span>
        </div>

        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="font-display font-bold text-brand-dark text-lg">
            ₦{price.toLocaleString()}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-brand-text-muted font-semibold">
            / day
          </span>
        </div>

        <div className="h-px w-full bg-gray-100 my-3"></div>

        <div className="flex items-center justify-between text-brand-text-muted text-xs font-medium">
          <div className="flex items-center gap-1.5" title="Seats">
            <Users className="w-3.5 h-3.5" />
            <span>{car.seatNumber || 4}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Transmission">
            <Settings2 className="w-3.5 h-3.5" />
            <span className="capitalize">{car.transmission || 'Auto'}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Category">
            <Gauge className="w-3.5 h-3.5" />
            <span className="capitalize">{car.category || 'Standard'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

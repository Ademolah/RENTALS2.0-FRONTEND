import { MapPin, Users, Settings2, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CarCard({ car }) {
  // Safe fallbacks for data
  const make = car.make || 'Unknown Make';
  const model = car.carModel || 'Model';
  const price = Number(car.pricePer12Hours || car.price || 0);
  const image = car.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80';

  return (
    <Link to={`/cars/${car._id}`} className="group block flex-col gap-3 rounded-2xl transition-all duration-300">
      
      {/* Image Hero Container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-3 bg-gray-100">
        <img 
          src={image} 
          alt={`${make} ${model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {car.isAvailable && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
            Available Now
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="flex flex-col px-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {make} {model} <span className="text-gray-500 text-sm font-medium ml-1">{car.year}</span>
            </h3>
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{car.location?.city || 'Lagos'}, {car.location?.state || 'LA'}</span>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-extrabold text-brand-dark">
              ₦{price.toLocaleString()}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">
              per 12 hrs
            </div>
          </div>
        </div>

        {/* Elegant Divider */}
        <div className="h-[1px] w-full bg-gray-100 my-3"></div>

        {/* Vehicle Specs Bar */}
        <div className="flex items-center justify-between text-gray-500 text-xs font-medium px-1">
          <div className="flex items-center gap-1.5" title="Seats">
            <Users className="w-4 h-4" />
            <span>{car.seats || 4} Seats</span>
          </div>
          <div className="flex items-center gap-1.5" title="Transmission">
            <Settings2 className="w-4 h-4" />
            <span className="capitalize">{car.transmission || 'Auto'}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Category">
            <Gauge className="w-4 h-4" />
            <span className="capitalize">{car.category || 'Standard'}</span>
          </div>
        </div>
      </div>
      
    </Link>
  );
}
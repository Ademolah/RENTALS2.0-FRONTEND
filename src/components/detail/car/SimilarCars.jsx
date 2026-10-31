import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80';

export default function SimilarCars({ cars, city }) {
  if (cars.length === 0) return null;
  return (
    <div className="mt-12 pt-16 border-t border-gray-100">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-brand-dark tracking-tight">More luxury vehicles</h3>
          <p className="text-brand-text-secondary font-medium mt-1">Similar premium cars available in {city}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cars.map((simCar) => (
          <Link
            key={simCar._id || simCar.id}
            to={`/cars/${simCar._id || simCar.id}`}
            className="group flex flex-col cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
              <img
                src={simCar.images?.[0] || FALLBACK_IMAGE}
                alt={`${simCar.make} ${simCar.model}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-brand-dark uppercase tracking-wider">
                {simCar.category || 'Luxury'}
              </div>
            </div>

            <div className="p-5">
              <h4 className="font-bold text-brand-dark text-base truncate mb-1 group-hover:text-brand-primary transition-colors">
                {simCar.make} {simCar.model}
              </h4>
              <p className="text-base text-brand-text-secondary mb-3 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {simCar.location?.city}
              </p>
              <div className="flex items-baseline space-x-1 pt-3 border-t border-gray-100">
                <span className="font-display font-bold text-brand-dark text-lg">₦{(simCar.pricePer12Hours || 0).toLocaleString()}</span>
                <span className="text-xs text-brand-text-secondary font-medium">/ day</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { Star, Heart } from 'lucide-react';

export default function PropertyCard({ property }) {
  // We will build a full carousel later, this handles the visual structure for now
  return (
    <div className="group cursor-pointer flex flex-col gap-3">
      {/* Image Container */}
      <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-gray-200">
        <img 
          src={property.image} 
          alt={property.title} 
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Top Badges overlay */}
        <div className="absolute top-3 w-full px-3 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            {/* 'R' Verified Badge */}
            {property.isRentalVerified && (
              <div className="bg-white/95 backdrop-blur-sm shadow-sm px-2 py-1 rounded-md flex items-center space-x-1">
                <span className="text-brand-primary font-bold text-sm leading-none">R</span>
                <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Verified</span>
              </div>
            )}
            
            {/* Availability Status */}
            <div className={`px-2 py-1 rounded-md backdrop-blur-sm shadow-sm flex items-center space-x-1.5 ${
              property.isAvailable ? 'bg-white/95' : 'bg-gray-900/90'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                property.isAvailable ? 'bg-[#008A05]' : 'bg-brand-primary'
              }`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                property.isAvailable ? 'text-gray-800' : 'text-white'
              }`}>
                {property.isAvailable ? 'Available' : 'Booked'}
              </span>
            </div>
          </div>

          {/* Favorite Button */}
          <button className="text-white hover:scale-110 transition-transform drop-shadow-md">
            <Heart className="w-6 h-6 fill-black/20 stroke-white stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Property Details */}
      <div className="flex flex-col text-brand-dark">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-[15px] leading-tight truncate pr-4">
            {property.location}
          </h3>
          <div className="flex items-center space-x-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-brand-dark text-brand-dark" />
            <span className="text-sm">{property.rating}</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm truncate">{property.title}</p>
        <p className="text-gray-500 text-sm">{property.dates}</p>
        <div className="mt-1 flex items-center space-x-1">
          <span className="font-semibold">₦{property.price.toLocaleString()}</span>
          <span className="text-gray-800 text-sm">night</span>
        </div>
      </div>
    </div>
  );
}
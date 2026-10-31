import { MapPin } from 'lucide-react';
import { StayFacts, DirectionsLink } from '../detailParts';
import { coordsOf } from '../detailUtils';
import { getAmenityIcon } from './hotelHelpers';
import { cleanList } from '../../../lib/lists';

function Amenities({ amenities }) {
  const items = cleanList(amenities);
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-6">Premium Amenities</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
        {items.map((amenity, idx) => {
          const Icon = getAmenityIcon(amenity);
          return (
            <div key={idx} className="flex items-center text-brand-dark text-base font-medium">
              <div className="p-3 bg-brand-primary-soft rounded-xl mr-3">
                <Icon className="w-5 h-5 text-brand-primary" />
              </div>
              {amenity}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Title, rating, address, description, stay facts and amenities.
export default function HotelInfo({ hotel }) {
  const address = [hotel.address?.street, hotel.address?.city, hotel.address?.state].filter(Boolean).join(', ');
  return (
    <>
      <div>
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-brand-dark tracking-tight leading-[1.05]">
            {hotel.title}
          </h1>
          <div className="hidden md:flex flex-col items-end ml-4">
            <div className="bg-brand-primary text-white font-display font-bold text-xl px-4 py-2 rounded-xl shadow-sm">
              {hotel.reviewsCount > 0 ? hotel.rating?.toFixed(1) : 'New'}
            </div>
            <span className="text-sm font-bold text-brand-text-secondary mt-1">
              {hotel.reviewsCount || 0} review{hotel.reviewsCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center text-gray-600 text-sm font-medium mb-6">
          <MapPin className="w-5 h-5 mr-2 text-brand-primary shrink-0" />
          <span className="text-lg">{hotel.address?.street}, {hotel.address?.city}, {hotel.address?.state}</span>
        </div>
        <DirectionsLink {...coordsOf(hotel.address?.coordinates || hotel.location?.coordinates)} address={address} />
      </div>

      <hr className="border-gray-200" />

      <div>
        <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-2">About this hotel</h2>
        <p className="mb-4 text-base font-medium text-brand-text-secondary">Managed by Rentals Africa</p>
        <p className="text-brand-text-secondary leading-8 text-lg whitespace-pre-line">
          {hotel.description}
        </p>
      </div>

      <StayFacts checkInTime={hotel.checkInTime} checkOutTime={hotel.checkOutTime} price={hotel.startingPrice} />

      <Amenities amenities={hotel.amenities} />
    </>
  );
}

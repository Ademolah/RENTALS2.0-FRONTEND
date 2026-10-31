import { Users, Bed } from 'lucide-react';
import { cleanList } from '../../../lib/lists';

export default function RoomList({ hotel, selectedRoom, onSelect }) {
  return (
    <div id="rooms-section">
      <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-6">Available Suites</h2>
      <div className="space-y-6">
        {hotel.roomTypes?.map((room) => {
          const isSelected = selectedRoom === room._id;
          const roomImage = room.images && room.images.length > 0 ? room.images[0] : hotel.images[0];

          return (
            <div
              key={room._id}
              onClick={() => onSelect(room._id)}
              className={`flex flex-col sm:flex-row bg-white rounded-3xl overflow-hidden border transition-all cursor-pointer shadow-soft hover:shadow-card-hover ${
                isSelected ? 'border-brand-primary ring-1 ring-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-full sm:w-1/3 h-48 sm:h-auto">
                <img src={roomImage} alt={room.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-display font-bold text-brand-dark">{room.name}</h3>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <div className="flex items-center text-brand-text-secondary text-base mt-2 mb-4 space-x-4">
                    <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {room.capacity?.adults || 2} Guests</span>
                    <span className="flex items-center"><Bed className="w-4 h-4 mr-1" /> Suite</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cleanList(room.amenities).map((am, i) => (
                      <span key={i} className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-md">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
                  <span className="text-2xl font-display font-bold text-brand-dark tracking-tight">
                    ₦{room.pricePerNight.toLocaleString()} <span className="text-base font-medium text-brand-text-secondary">/ night</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

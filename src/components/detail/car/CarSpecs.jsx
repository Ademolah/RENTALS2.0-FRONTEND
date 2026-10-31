import { Users, Settings2, Gauge, Truck, CheckCircle2, Video } from 'lucide-react';
import { cleanList } from '../../../lib/lists';

function SpecTile({ icon: Icon, label, children, valueClass = '' }) {
  return (
    <div className="flex items-center space-x-3 bg-brand-accent-soft px-5 py-4 rounded-2xl flex-1 min-w-[190px]">
      <Icon className="w-5 h-5 text-brand-text-secondary" />
      <div className="flex flex-col">
        <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">{label}</span>
        <span className={`text-lg font-display font-bold text-brand-dark ${valueClass}`}>{children}</span>
      </div>
    </div>
  );
}

// Left column of the car page: spec tiles, description, features and the video tour.
export default function CarSpecs({ car, poster }) {
  return (
    <div className="lg:col-span-2 space-y-10">
      <div className="flex flex-wrap gap-4 pb-8 border-b border-gray-200">
        <SpecTile icon={Users} label="Seats">{car.seatNumber || 4} Passengers</SpecTile>
        <SpecTile icon={Settings2} label="Transmission" valueClass="capitalize">{car.transmission || 'Automatic'}</SpecTile>
        <SpecTile icon={Gauge} label="Class" valueClass="capitalize">{car.category || 'Luxury'}</SpecTile>
        {car.deliveryAvailable && (
          <SpecTile icon={Truck} label="Delivery">Available · ₦{Number(car.deliveryFee || 0).toLocaleString()}</SpecTile>
        )}
      </div>

      <div>
        <h3 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-5">About this vehicle</h3>
        <p className="text-brand-text-secondary text-lg leading-8 whitespace-pre-line">
          {car.description || 'A premium, meticulously maintained vehicle ready for your travel needs.'}
        </p>
      </div>

      {cleanList(car.features).length > 0 && (
        <div>
          <h3 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-5">Features & Amenities</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
            {cleanList(car.features).map((feature, i) => (
              <div key={i} className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-status-available shrink-0" />
                <span className="text-brand-dark font-medium text-base">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {car.video && (
        <div className="pt-4 pb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Video className="w-5 h-5 text-brand-dark" />
            <h3 className="text-3xl font-display font-bold text-brand-dark tracking-tight">Cinematic Tour</h3>
          </div>
          <div className="w-full relative rounded-2xl overflow-hidden bg-black shadow-lg group">
            <video
              src={car.video}
              controls
              preload="metadata"
              className="w-full h-auto max-h-[450px] object-contain"
              poster={poster}
            />
          </div>
        </div>
      )}
    </div>
  );
}

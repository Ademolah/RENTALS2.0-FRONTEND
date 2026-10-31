import { Clock, User, Truck } from 'lucide-react';
import { CONCIERGE_TIME_SLOTS, DURATION_OPTIONS } from './carHelpers';

export function TimeAndDuration({ pickupTime, onTime, durationSlots, onDuration }) {
  return (
    <>
      <div>
        <div className="flex items-center space-x-2 mb-2.5">
          <Clock className="w-3.5 h-3.5 text-brand-text-muted" />
          <label className="text-xs font-bold uppercase tracking-widest text-brand-dark">Pickup Time</label>
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x">
          {CONCIERGE_TIME_SLOTS.map((time) => {
            const isSelected = pickupTime === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => onTime(time)}
                className={`snap-start shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                  isSelected ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]' : 'bg-white border-gray-200 text-brand-text-secondary hover:border-gray-400 hover:text-brand-dark'
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
        <label className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-secondary block mb-0.5">Rental Duration</label>
        <select
          value={durationSlots}
          onChange={(e) => onDuration(Number(e.target.value))}
          className="w-full text-base outline-none bg-transparent font-bold cursor-pointer text-brand-dark"
        >
          {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </>
  );
}

function Radio({ on }) {
  return (
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${on ? 'border-brand-primary' : 'border-gray-300'}`}>
      {on && <div className="w-2 h-2 bg-brand-primary rounded-full"></div>}
    </div>
  );
}

// Chauffeur add-on, delivery option and the driving-licence acknowledgement.
export function BookingOptions({ car, booking }) {
  const {
    chauffeurIncluded, needsChauffeur, setNeedsChauffeur,
    needsDelivery, setNeedsDelivery, deliveryAddress, setDeliveryAddress,
    licenseAck, setLicenseAck,
  } = booking;

  return (
    <>
      {!chauffeurIncluded && (
        <div
          onClick={() => setNeedsChauffeur(!needsChauffeur)}
          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
            needsChauffeur ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${needsChauffeur ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-text-muted'}`}>
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-base font-bold ${needsChauffeur ? 'text-brand-dark' : 'text-gray-700'}`}>Add Chauffeur</div>
              <div className="text-xs text-brand-text-secondary font-medium">₦25,000 / 12 hrs</div>
            </div>
          </div>
          <Radio on={needsChauffeur} />
        </div>
      )}

      {car.deliveryAvailable && (
        <div className={`p-3.5 rounded-2xl border-2 transition-all ${needsDelivery ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 bg-white'}`}>
          <div onClick={() => setNeedsDelivery(!needsDelivery)} className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${needsDelivery ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-text-muted'}`}>
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-base font-bold text-brand-dark">Deliver to me</div>
                <div className="text-sm text-brand-text-secondary font-medium">₦{Number(car.deliveryFee || 0).toLocaleString()} delivery fee</div>
              </div>
            </div>
            <Radio on={needsDelivery} />
          </div>
          {needsDelivery && (
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Where should we bring it?"
              className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-200 text-base text-brand-dark outline-none focus:border-brand-dark"
              aria-label="Where should we bring it?"
            />
          )}
        </div>
      )}

      <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-100 cursor-pointer">
        <input type="checkbox" checked={licenseAck} onChange={(e) => setLicenseAck(e.target.checked)} className="mt-1 w-5 h-5 accent-brand-primary" />
        <span className="text-sm text-brand-text-secondary leading-relaxed">I hold a valid driving licence and will present it when I collect the vehicle.</span>
      </label>
    </>
  );
}

import { Plus, Trash2, BedDouble, Image as ImageIcon } from 'lucide-react';
import ArrivalGuideFields from '../ArrivalGuideFields';
import SuggestedPrice from '../SuggestedPrice';
import { Field, TextAreaField } from './Field';
import { AmenityTiles, Switch } from './controls';
import { HOTEL_AMENITIES } from './constants';
import { useObjectUrls } from './useMedia';

const STEP = 'animate-in fade-in slide-in-from-right-4 duration-300';
const WIZARD_LABEL = 'block text-xs font-bold text-gray-500 uppercase tracking-widest';
const PLAIN_INPUT = 'bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all';
const ROOM_LABEL = 'block text-xs font-bold text-gray-500 uppercase mb-1';
const ROOM_INPUT = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-primary';

export function ProfileStep({ form, onField, onAddress, arrival }) {
  return (
    <div className={`space-y-6 ${STEP}`}>
      <Field
        theme="wizard" label="Hotel Name" type="text" placeholder="e.g. The Rentals Luxury Resort" aria-label="e.g. The Rentals Luxury Resort"
        value={form.title} onChange={(e) => onField('title', e.target.value)}
      />
      <TextAreaField
        theme="wizard" label="Description" rows={4} placeholder="Describe the hotel's vibe, audience, and unique selling points..."
        value={form.description} onChange={(e) => onField('description', e.target.value)}
      />

      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-4 rounded-xl">
        <div>
          <h4 className="font-bold text-gray-900">Complimentary Breakfast</h4>
          <p className="text-xs text-gray-500 mt-0.5">Is breakfast included for all guests?</p>
        </div>
        <Switch typed={false} on={form.hasBreakfast} onClick={() => onField('hasBreakfast', !form.hasBreakfast)} />
      </div>

      <div className="space-y-4">
        <label className={WIZARD_LABEL}>Location Details</label>
        <input
          type="text" value={form.address.street} onChange={(e) => onAddress('street', e.target.value)}
          placeholder="Street Address (e.g. 15 Bourdillon Rd)" className={`w-full ${PLAIN_INPUT}`} aria-label="Street Address (e.g. 15 Bourdillon Rd)"
        />
        <div className="flex gap-4">
          <input
            type="text" value={form.address.city} onChange={(e) => onAddress('city', e.target.value)}
            placeholder="City" className={`w-1/2 ${PLAIN_INPUT}`} aria-label="City"
          />
          <select value={form.address.state} onChange={(e) => onAddress('state', e.target.value)} className={`w-1/2 ${PLAIN_INPUT} cursor-pointer`}>
            <option value="" disabled>Select State</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
          </select>
        </div>
      </div>

      <ArrivalGuideFields {...arrival} label="Arrival guide" />
    </div>
  );
}

export function MediaStep({ form, onToggleAmenity, onAddImages, onRemoveImage }) {
  const urls = useObjectUrls(form.images);
  return (
    <div className={`space-y-8 ${STEP}`}>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select Amenities</label>
        <AmenityTiles variant="create" gridClass="grid grid-cols-2 sm:grid-cols-3 gap-3" options={HOTEL_AMENITIES} selected={form.amenities} onToggle={onToggleAmenity} />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Property Images</label>
        <label htmlFor="hotel-images" className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Click to upload photos</p>
          <p className="text-xs text-gray-500">Select multiple PNG or JPGs</p>
          <input id="hotel-images" type="file" multiple accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" onChange={onAddImages} />
        </label>

        {form.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
            {urls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 shadow-sm">
                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                <button
                  type="button" onClick={() => onRemoveImage(idx)} aria-label="Delete"
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RoomsStep({ form, onRoom, onAddRoom, onRemoveRoom }) {
  const rooms = form.roomTypes;
  const number = (index, field, label, extra = {}) => (
    <Field
      theme="wizard" wrapperClass="w-1/2" labelClassName={ROOM_LABEL} controlClassName={ROOM_INPUT} label={label} type="number"
      value={field.split('.').reduce((o, k) => o[k], rooms[index])} onChange={(e) => onRoom(index, field, Number(e.target.value))} {...extra}
    />
  );
  return (
    <div className={`space-y-6 ${STEP}`}>
      <div className="flex items-center justify-between mb-2">
        <label className={WIZARD_LABEL}>Configure Room Types</label>
        <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-md">
          {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'} Added
        </span>
      </div>

      <SuggestedPrice category="hotels" state={form.address.state} area={form.address.city} onUse={(price) => onRoom(0, 'pricePerNight', price)} />

      <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {rooms.map((room, index) => (
          <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm relative group">
            {rooms.length > 1 && (
              <button
                onClick={() => onRemoveRoom(index)} aria-label="Delete"
                className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <BedDouble className="w-4 h-4 mr-2 text-gray-400" /> Room Configuration {index + 1}
            </h4>

            <div className="space-y-4">
              <input
                type="text" value={room.name} onChange={(e) => onRoom(index, 'name', e.target.value)}
                placeholder="Room Name (e.g. Deluxe King Suite)" aria-label="Room Name (e.g. Deluxe King Suite)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base font-bold focus:outline-none focus:border-brand-primary"
              />
              <div className="flex gap-4">
                {number(index, 'pricePerNight', 'Price / Night (₦)')}
                {number(index, 'totalInventory', 'Total Inventory', { min: '1' })}
              </div>
              <div className="flex gap-4">
                {number(index, 'capacity.adults', 'Max Adults', { min: '1' })}
                {number(index, 'capacity.children', 'Max Children', { min: '0' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAddRoom}
        className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" /> Add Another Room Type
      </button>
    </div>
  );
}

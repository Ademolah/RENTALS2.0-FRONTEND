import { Building, Plus, Trash2 } from 'lucide-react';
import { updateHotel, getHotelById } from '../api/hotel';
import { Field, SelectField, TextAreaField } from './host/forms/Field';
import { AmenityTiles, Switch } from './host/forms/controls';
import DangerZone from './host/forms/DangerZone';
import { toggleItem } from './host/forms/helpers';
import { EditShell } from './host/forms/shells';
import { EditImageGrid } from './host/forms/media';
import { useEditListing } from './host/forms/useEditListing';
import { HOTEL_AMENITIES } from './host/forms/constants';

const INITIAL_FORM = {
  title: '',
  description: '',
  hasBreakfast: false,
  address: { street: '', city: '', state: '', country: 'Nigeria' },
  amenities: [],
  roomTypes: [],
  isAvailable: true,
  existingImages: [],
  newImages: [],
};

const newRoom = () => ({ name: '', pricePerNight: '', capacity: { adults: 2, children: 0 }, totalInventory: 1, amenities: [] });

function toForm(response) {
  const hotel = response?.data?.hotel || response?.data?.property || response?.data;
  if (!hotel) return null;
  return {
    title: hotel.title || '',
    description: hotel.description || '',
    hasBreakfast: hotel.hasBreakfast || false,
    address: {
      street: hotel.address?.street || '',
      city: hotel.address?.city || '',
      state: hotel.address?.state || '',
      country: hotel.address?.country || 'Nigeria',
    },
    amenities: hotel.amenities || [],
    roomTypes: hotel.roomTypes || [],
    isAvailable: hotel.isAvailable !== undefined ? hotel.isAvailable : true,
    existingImages: hotel.images || [],
    newImages: [],
  };
}

function buildPayload(form) {
  const payload = new FormData();
  payload.append('title', form.title);
  payload.append('description', form.description);
  payload.append('hasBreakfast', form.hasBreakfast.toString());
  payload.append('isAvailable', form.isAvailable);
  const lowestPrice = form.roomTypes.length > 0 ? Math.min(...form.roomTypes.map((r) => Number(r.pricePerNight) || 0)) : 0;
  payload.append('startingPrice', lowestPrice);
  payload.append('address', JSON.stringify(form.address));
  payload.append('amenities', JSON.stringify(form.amenities));
  payload.append('roomTypes', JSON.stringify(form.roomTypes));
  payload.append('existingImages', JSON.stringify(form.existingImages));
  form.newImages.forEach((file) => payload.append('images', file));
  return payload;
}

const SectionHeading = ({ children }) => (
  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">{children}</h3>
);

const ROOM_LABEL = 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1';
const ROOM_INPUT = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold';

export default function EditHotelModal({ isOpen, onClose, onSuccess, hotelId }) {
  const ed = useEditListing({
    isOpen,
    id: hotelId,
    initialForm: INITIAL_FORM,
    fetchById: getHotelById,
    toForm,
    loadFailMessage: 'Failed to fetch current hotel data.',
    buildPayload,
    save: updateHotel,
    successMessage: 'Hotel updated successfully!',
    failMessage: 'Failed to update hotel.',
    onSuccess,
    onClose,
  });
  const { formData, patch } = ed;

  if (!isOpen || !hotelId) return null;

  const setAddress = (fields) => patch({ address: { ...formData.address, ...fields } });
  const setRoom = (index, field, value) => patch({ roomTypes: formData.roomTypes.map((r, i) => (i === index ? { ...r, [field]: value } : r)) });
  const removeRoom = (index) => {
    if (formData.roomTypes.length === 1) return;
    patch({ roomTypes: formData.roomTypes.filter((_, i) => i !== index) });
  };

  return (
    <EditShell
      icon={Building}
      title="Manage Hotel"
      subtitle="Update Profile & Inventory"
      onClose={onClose}
      formId="editHotelForm"
      loading={ed.isLoading}
      loadingText="Loading Hotel Specs..."
      onSubmit={ed.handleSubmit}
      submitting={ed.isSubmitting}
      toast={ed.toast}
      widthClass="max-w-4xl"
      heightClass="h-[90vh]"
      formSpace="space-y-10"
    >
      <section className="space-y-4">
        <SectionHeading>1. Profile & Location</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field theme="edit" label="Hotel Name" type="text" value={formData.title} onChange={(e) => patch({ title: e.target.value })} />
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-xl mt-6 md:mt-0">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Free Breakfast</h4>
              <p className="text-xs text-gray-500">Included for all guests</p>
            </div>
            <Switch size="sm" on={formData.hasBreakfast} onClick={() => patch({ hasBreakfast: !formData.hasBreakfast })} />
          </div>
        </div>

        <TextAreaField theme="edit" label="Description" rows="3" value={formData.description} onChange={(e) => patch({ description: e.target.value })} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field theme="edit" wrapperClass="md:col-span-2" label="Street Address" type="text" value={formData.address.street} onChange={(e) => setAddress({ street: e.target.value })} />
          <SelectField theme="edit" label="State" extra="appearance-none" value={formData.address.state} onChange={(e) => setAddress({ state: e.target.value })}>
            <option value="" disabled>Select State</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
          </SelectField>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading>2. Amenities</SectionHeading>
        <AmenityTiles
          variant="edit"
          gridClass="grid grid-cols-2 md:grid-cols-4 gap-3"
          options={HOTEL_AMENITIES}
          selected={formData.amenities}
          onToggle={(name) => patch({ amenities: toggleItem(formData.amenities, name) })}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading>3. Room Inventory</SectionHeading>
        <div className="space-y-4">
          {formData.roomTypes.map((room, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-5 relative group">
              {formData.roomTypes.length > 1 && (
                <button type="button" onClick={() => removeRoom(index)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field theme="edit" labelClassName={ROOM_LABEL} controlClassName={ROOM_INPUT} label="Room Name" type="text" value={room.name} onChange={(e) => setRoom(index, 'name', e.target.value)} />
                <div className="flex gap-4">
                  <Field theme="edit" wrapperClass="w-1/2" labelClassName={ROOM_LABEL} controlClassName={ROOM_INPUT} label="Rate (₦)" type="number" value={room.pricePerNight} onChange={(e) => setRoom(index, 'pricePerNight', e.target.value)} />
                  <Field theme="edit" wrapperClass="w-1/2" labelClassName={ROOM_LABEL} controlClassName={ROOM_INPUT} label="Total Rooms" type="number" value={room.totalInventory} onChange={(e) => setRoom(index, 'totalInventory', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => patch({ roomTypes: [...formData.roomTypes, newRoom()] })} className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-50 transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Add Room Category
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading>4. Gallery</SectionHeading>
        <EditImageGrid
          variant="compact"
          existing={formData.existingImages}
          newUrls={ed.newUrls}
          onRemoveExisting={ed.removeExisting}
          onRemoveNew={ed.removeNew}
          onAdd={ed.addImages}
        />
      </section>

      <DangerZone assetId={hotelId} assetType="HOTEL" assetName={formData.title || formData.name} onClose={onClose} onSuccess={onSuccess} />
    </EditShell>
  );
}

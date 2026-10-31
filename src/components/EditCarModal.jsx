import { Car } from 'lucide-react';
import { updateCar, getCarById } from '../api/car';
import { Field, TextAreaField } from './host/forms/Field';
import { ActiveListingRow } from './host/forms/controls';
import DangerZone from './host/forms/DangerZone';
import { EditShell } from './host/forms/shells';
import { EditImageGrid } from './host/forms/media';
import { useEditListing } from './host/forms/useEditListing';

const INITIAL_FORM = {
  make: '',
  carModel: '',
  year: '',
  description: '',
  pricePer12Hours: '',
  seatNumber: '',
  features: '',
  isAvailable: true,
  existingImages: [],
  newImages: [],
};

function toForm(response) {
  const car = response?.data?.car;
  if (!car) return null;
  return {
    make: car.make || '',
    carModel: car.carModel || '',
    year: car.year || '',
    description: car.description || '',
    pricePer12Hours: car.pricePer12Hours || '',
    seatNumber: car.seatNumber || '',
    features: car.features ? car.features.join(', ') : '',
    isAvailable: car.isAvailable !== undefined ? car.isAvailable : true,
    existingImages: car.images || [],
    newImages: [],
  };
}

function buildPayload(form) {
  const payload = new FormData();
  payload.append('make', form.make);
  payload.append('carModel', form.carModel);
  payload.append('year', form.year);
  payload.append('description', form.description);
  payload.append('pricePer12Hours', Number(form.pricePer12Hours));
  payload.append('seatNumber', form.seatNumber);
  payload.append('isAvailable', form.isAvailable);
  form.features.split(',').map((f) => f.trim()).filter(Boolean).forEach((f) => payload.append('features', f));
  form.existingImages.forEach((img) => payload.append('existingImages', img));
  form.newImages.forEach((file) => payload.append('images', file));
  return payload;
}

export default function EditCarModal({ isOpen, onClose, onSuccess, carId }) {
  const ed = useEditListing({
    isOpen,
    id: carId,
    initialForm: INITIAL_FORM,
    fetchById: getCarById,
    toForm,
    loadFailMessage: 'Failed to fetch current vehicle data.',
    buildPayload,
    save: updateCar,
    successMessage: 'Vehicle updated successfully!',
    failMessage: 'Failed to update vehicle.',
    onSuccess,
    onClose,
  });
  const { formData, patch } = ed;

  if (!isOpen || !carId) return null;

  return (
    <EditShell
      icon={Car}
      title="Comprehensive Asset Editor"
      subtitle="Update Vehicle Specs & Pricing"
      onClose={onClose}
      formId="editCarForm"
      loading={ed.isLoading}
      loadingText="Loading Vehicle Specs..."
      onSubmit={ed.handleSubmit}
      submitting={ed.isSubmitting}
      toast={ed.toast}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field theme="edit" label="Make" type="text" value={formData.make} onChange={(e) => patch({ make: e.target.value })} />
        <Field theme="edit" label="Model" type="text" value={formData.carModel} onChange={(e) => patch({ carModel: e.target.value })} />
        <Field theme="edit" label="Year" type="number" value={formData.year} onChange={(e) => patch({ year: e.target.value })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field theme="edit" label="12-Hour Rate (₦)" type="number" value={formData.pricePer12Hours} onChange={(e) => patch({ pricePer12Hours: e.target.value })} />
        <Field theme="edit" label="Seats" type="number" value={formData.seatNumber} onChange={(e) => patch({ seatNumber: e.target.value })} />
      </div>

      <div className="space-y-4">
        <TextAreaField theme="edit" label="Description" rows="3" value={formData.description} onChange={(e) => patch({ description: e.target.value })} />
        <Field
          theme="edit"
          label="Features (Comma Separated)"
          type="text"
          value={formData.features}
          onChange={(e) => patch({ features: e.target.value })}
          placeholder="Leather Seats, V6 Engine, Tinted..."
          aria-label="Leather Seats, V6 Engine, Tinted..."
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Asset Images</label>
        <EditImageGrid
          existing={formData.existingImages}
          newUrls={ed.newUrls}
          onRemoveExisting={ed.removeExisting}
          onRemoveNew={ed.removeNew}
          onAdd={ed.addImages}
        />
      </div>

      <ActiveListingRow on={formData.isAvailable} onToggle={() => patch({ isAvailable: !formData.isAvailable })} />

      <DangerZone assetId={carId} assetType="CAR" assetName={formData.title || formData.carModel} onClose={onClose} onSuccess={onSuccess} />
    </EditShell>
  );
}

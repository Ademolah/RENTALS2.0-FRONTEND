import { Building } from 'lucide-react';
import { updateProperty, getPropertyById } from '../api/properties';
import { Field, TextAreaField } from './host/forms/Field';
import { ActiveListingRow } from './host/forms/controls';
import DangerZone from './host/forms/DangerZone';
import { EditShell } from './host/forms/shells';
import { EditImageGrid } from './host/forms/media';
import { useEditListing } from './host/forms/useEditListing';

const INITIAL_FORM = {
  title: '',
  description: '',
  pricePerNight: '',
  address: { street: '', city: '', state: '', country: 'Nigeria' },
  capacity: { adults: 2, bedrooms: 1 },
  isAvailable: true,
  existingImages: [],
  newImages: [],
};

function toForm(response) {
  const property = response?.data?.property || response?.data;
  if (!property) return null;
  return {
    title: property.title || '',
    description: property.description || '',
    pricePerNight: property.pricePerNight || property.startingPrice || '',
    address: {
      street: property.address?.street || '',
      city: property.address?.city || '',
      state: property.address?.state || '',
      country: property.address?.country || 'Nigeria',
    },
    capacity: {
      adults: property.capacity?.adults || 2,
      bedrooms: property.capacity?.bedrooms || 1,
    },
    isAvailable: property.isAvailable !== undefined ? property.isAvailable : true,
    existingImages: property.images || [],
    newImages: [],
  };
}

function buildPayload(form) {
  const payload = new FormData();
  payload.append('title', form.title);
  payload.append('description', form.description);
  payload.append('pricePerNight', Number(form.pricePerNight));
  payload.append('isAvailable', form.isAvailable);
  payload.append('address', JSON.stringify(form.address));
  payload.append('capacity', JSON.stringify(form.capacity));
  form.existingImages.forEach((img) => payload.append('existingImages', img));
  form.newImages.forEach((file) => payload.append('images', file));
  return payload;
}

export default function EditPropertyModal({ isOpen, onClose, onSuccess, propertyId }) {
  const ed = useEditListing({
    isOpen,
    id: propertyId,
    initialForm: INITIAL_FORM,
    fetchById: getPropertyById,
    toForm,
    loadFailMessage: 'Failed to fetch current property data.',
    buildPayload,
    save: updateProperty,
    successMessage: 'Property updated successfully!',
    failMessage: 'Failed to update property.',
    onSuccess,
    onClose,
  });
  const { formData, patch } = ed;

  if (!isOpen || !propertyId) return null;

  return (
    <EditShell
      icon={Building}
      title="Manage Shortlet"
      subtitle="Update Property Specs"
      onClose={onClose}
      formId="editPropertyForm"
      loading={ed.isLoading}
      loadingText="Loading Property Data..."
      onSubmit={ed.handleSubmit}
      submitting={ed.isSubmitting}
      toast={ed.toast}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field theme="edit" label="Property Title" type="text" value={formData.title} onChange={(e) => patch({ title: e.target.value })} />
        <Field theme="edit" label="Nightly Rate (₦)" type="number" value={formData.pricePerNight} onChange={(e) => patch({ pricePerNight: e.target.value })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field theme="edit" label="City" type="text" value={formData.address.city} onChange={(e) => patch({ address: { ...formData.address, city: e.target.value } })} />
        <Field theme="edit" label="Bedrooms" type="number" value={formData.capacity.bedrooms} onChange={(e) => patch({ capacity: { ...formData.capacity, bedrooms: e.target.value } })} />
      </div>

      <TextAreaField theme="edit" label="Description" rows="3" value={formData.description} onChange={(e) => patch({ description: e.target.value })} />

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Property Images</label>
        <EditImageGrid
          existing={formData.existingImages}
          newUrls={ed.newUrls}
          onRemoveExisting={ed.removeExisting}
          onRemoveNew={ed.removeNew}
          onAdd={ed.addImages}
        />
      </div>

      <ActiveListingRow on={formData.isAvailable} onToggle={() => patch({ isAvailable: !formData.isAvailable })} />

      <DangerZone assetId={propertyId} assetType="SHORTLET" assetName={formData.title} onClose={onClose} onSuccess={onSuccess} />
    </EditShell>
  );
}

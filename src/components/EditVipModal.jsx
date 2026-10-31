import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Clock, Wine, Tags } from 'lucide-react';
import { getVipEstablishmentById, updateVipEstablishment } from '../api/vip';
import { Field, SelectField, TextAreaField } from './host/forms/Field';
import { ChipGroup, ErrorAlert } from './host/forms/controls';
import DangerZone from './host/forms/DangerZone';
import { toggleItem } from './host/forms/helpers';
import { StudioEditShell } from './host/forms/shells';
import { useImageList } from './host/forms/useMedia';
import { StateCityFields, StudioDivider, StudioSectionTitle } from './host/forms/studio';
import VipEditPhotos from './host/forms/VipEditPhotos';
import { COMMON_VENUE_SERVICES, DAYS_OF_WEEK } from './host/forms/constants';

const INITIAL_FORM = {
  title: '',
  description: '',
  establishmentType: 'LOUNGE',
  depositAmount: 150000,
  dressCode: '',
  street: '',
  city: '',
  stateName: '',
  openTime: '',
  closeTime: '',
  daysOpen: [],
  services: [],
  existingImages: [],
};

const MAX_PHOTOS = 10;

function toForm(response) {
  const est = response.data?.data?.establishment || response.data?.establishment;
  return {
    title: est.title || '',
    description: est.description || '',
    establishmentType: est.establishmentType || 'LOUNGE',
    depositAmount: est.depositAmount || est.pricePerNight || 0,
    dressCode: est.dressCode || '',
    street: est.address?.street || '',
    city: est.address?.city || '',
    stateName: est.address?.state || '',
    openTime: est.openHours?.open || '',
    closeTime: est.openHours?.close || '',
    daysOpen: est.openHours?.daysOpen || [],
    services: est.services || [],
    existingImages: est.images || [],
  };
}

function buildPayload(form, newFiles) {
  const data = new FormData();
  data.append('title', form.title);
  data.append('description', form.description);
  data.append('establishmentType', form.establishmentType);
  data.append('depositAmount', form.depositAmount);
  data.append('dressCode', form.dressCode);
  data.append('street', form.street);
  data.append('city', form.city);
  data.append('state', form.stateName);
  data.append('open', form.openTime);
  data.append('close', form.closeTime);
  data.append('daysOpen', JSON.stringify(form.daysOpen));
  data.append('services', JSON.stringify(form.services));
  data.append('existingImages', JSON.stringify(form.existingImages));
  newFiles.forEach((file) => data.append('images', file));
  return data;
}

export default function EditVipModal({ isOpen, onClose, establishmentId, onSuccess }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const photos = useImageList(setError);

  useEffect(() => {
    if (!isOpen || !establishmentId) return undefined;
    let active = true;
    (async () => {
      setFetching(true);
      setError('');
      try {
        const response = await getVipEstablishmentById(establishmentId);
        if (active) setForm(toForm(response));
      } catch {
        if (active) setError('Failed to load establishment details.');
      } finally {
        if (active) setFetching(false);
      }
    })();
    return () => { active = false; };
  }, [isOpen, establishmentId]);

  if (!isOpen) return null;

  const patch = (fields) => setForm((prev) => ({ ...prev, ...fields }));
  const text = (key) => ({ value: form[key], onChange: (e) => patch({ [key]: e.target.value }) });

  const handleFileSelect = (e) => {
    photos.add(e.target.files, MAX_PHOTOS - form.existingImages.length, 'Maximum of 10 photos allowed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.existingImages.length === 0 && photos.files.length === 0) {
      setError('Please upload or keep at least one photograph.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateVipEstablishment(establishmentId, buildPayload(form, photos.files));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update VIP listing.');
      setLoading(false);
    }
  };

  return (
    <StudioEditShell title="Edit VIP Listing" onClose={onClose} formId="edit-vip-form" loading={fetching} saving={loading}>
      {fetching ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
          <p className="text-sm font-medium text-gray-500">Loading details...</p>
        </div>
      ) : (
        <form id="edit-vip-form" onSubmit={handleSubmit} className="space-y-12">
          <ErrorAlert variant="inline" message={error} />

          <section>
            <StudioSectionTitle icon={Wine}>Establishment Details</StudioSectionTitle>
            <div className="space-y-6">
              <Field theme="studioEdit" label="Establishment Name" type="text" required {...text('title')} />
              <TextAreaField theme="studioEdit" label="Description" required rows={3} {...text('description')} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField theme="studioEdit" label="Category" {...text('establishmentType')}>
                  <option value="LOUNGE">Premium Lounge</option>
                  <option value="CLUB">Nightclub</option>
                  <option value="FINE_DINING">Fine Dining</option>
                  <option value="BEACH_CLUB">Beach Club</option>
                  <option value="PRIVATE_YACHT">Private Yacht</option>
                  <option value="OTHER">Other</option>
                </SelectField>
                <Field theme="studioEdit" label="Dress Code" type="text" required {...text('dressCode')} />
              </div>
            </div>
          </section>

          <StudioDivider />

          <section>
            <StudioSectionTitle icon={MapPin}>Location</StudioSectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field theme="studioEdit" wrapperClass="md:col-span-2" label="Street Address" type="text" required {...text('street')} />
              <StateCityFields
                theme="studioEdit"
                stateName={form.stateName}
                city={form.city}
                onState={(e) => patch({ stateName: e.target.value, city: '' })}
                onCity={(city) => patch({ city })}
                cityLabel="City"
                stateExtra="appearance-none"
                cityExtra="appearance-none disabled:opacity-50"
              />
            </div>
          </section>

          <StudioDivider />

          <section>
            <StudioSectionTitle icon={Clock}>Operations</StudioSectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Field theme="studioEdit" label="Opening Time" type="text" required {...text('openTime')} />
              <Field theme="studioEdit" label="Closing Time" type="text" required {...text('closeTime')} />
            </div>
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Operating Days</label>
              <ChipGroup style="editDay" items={DAYS_OF_WEEK} selected={form.daysOpen} onToggle={(d) => patch({ daysOpen: toggleItem(form.daysOpen, d) })} labelOf={(d) => d.substring(0, 3)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Services</label>
              <ChipGroup style="editService" items={COMMON_VENUE_SERVICES} selected={form.services} onToggle={(s) => patch({ services: toggleItem(form.services, s) })} />
            </div>
          </section>

          <StudioDivider />

          <VipEditPhotos
            existing={form.existingImages}
            newUrls={photos.urls}
            max={MAX_PHOTOS}
            inputRef={fileInputRef}
            onRemoveExisting={(i) => patch({ existingImages: form.existingImages.filter((_, x) => x !== i) })}
            onRemoveNew={photos.remove}
            onPick={handleFileSelect}
          />

          <StudioDivider />

          <section className="pb-8">
            <StudioSectionTitle icon={Tags}>Deposit Configuration</StudioSectionTitle>
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Required Deposit</label>
                </div>
                <span className="text-3xl font-bold text-gray-900">₦{Number(form.depositAmount).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50000"
                max="5000000"
                step="50000"
                value={form.depositAmount}
                onChange={(e) => patch({ depositAmount: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-gray-900"
              />
            </div>
          </section>

          <DangerZone assetId={establishmentId} assetType="VIP" assetName={form.title} onClose={onClose} onSuccess={onSuccess} />
        </form>
      )}
    </StudioEditShell>
  );
}

import { useRef, useState } from 'react';
import { MapPin, Clock, Wine, Tags } from 'lucide-react';
import { createVipEstablishment, createVipService } from '../api/vip';
import { useToast } from './Toast';
import { useDraft } from './host/useDraft';
import DraftBar from './host/DraftBar';
import ArrivalGuideFields from './host/ArrivalGuideFields';
import { Field, SelectField, TextAreaField } from './host/forms/Field';
import { ChipGroup, ErrorAlert } from './host/forms/controls';
import { toggleItem } from './host/forms/helpers';
import { StudioShell } from './host/forms/shells';
import { QualityNotice, StudioPhotoDrop, StudioPreviewGrid } from './host/forms/media';
import { useImageList } from './host/forms/useMedia';
import { StateCityFields, StudioDivider, StudioPriceCard, StudioSectionTitle } from './host/forms/studio';
import VipCategoryTabs from './host/forms/VipCategoryTabs';
import {
  COMMON_LOGISTICS_SERVICES, COMMON_VENUE_SERVICES, DAYS_OF_WEEK, DEFAULT_OPEN_DAYS,
} from './host/forms/constants';

const DEFAULT_FORM = {
  title: '',
  description: '',
  establishmentType: 'LOUNGE',
  customCategory: '',
  dressCode: '',
  openTime: '10:00 PM',
  closeTime: '04:00 AM',
  daysOpen: DEFAULT_OPEN_DAYS,
  serviceType: 'ARMED_ESCORT',
  customServiceType: '',
  priceAmount: 150000,
  services: [],
  customService: '',
  street: '',
  city: '',
  stateName: '',
};

const CUSTOM_INPUT = 'w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-white';
const CUSTOM_PILL = 'px-4 py-2 rounded-full text-xs font-semibold transition-all border bg-gray-900 text-white border-gray-900 hover:bg-red-600 hover:border-red-600 group shadow-md flex items-center';

export default function AddVipModal({ isOpen, onClose, onEstablishmentAdded }) {
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [arrivalPhotos, setArrivalPhotos] = useState([]);
  const [listingCategory, setListingCategory] = useState('VENUE');
  const [form, setForm] = useState(DEFAULT_FORM);
  const photos = useImageList(setError);

  const isVenue = listingCategory === 'VENUE';

  const { savedAt, clearDraft } = useDraft(
    'rentals_draft_vip',
    isOpen,
    {
      listingCategory, ...form, customService: undefined, arrivalNotes,
    },
    (v) => {
      setListingCategory(v.listingCategory || 'VENUE');
      setForm({
        title: v.title || '',
        description: v.description || '',
        establishmentType: v.establishmentType || 'LOUNGE',
        customCategory: v.customCategory || '',
        dressCode: v.dressCode || '',
        openTime: v.openTime || '10:00 PM',
        closeTime: v.closeTime || '04:00 AM',
        daysOpen: Array.isArray(v.daysOpen) ? v.daysOpen : DEFAULT_OPEN_DAYS,
        serviceType: v.serviceType || 'ARMED_ESCORT',
        customServiceType: v.customServiceType || '',
        priceAmount: v.priceAmount ?? 150000,
        services: Array.isArray(v.services) ? v.services : [],
        customService: '',
        street: v.street || '',
        city: v.city || '',
        stateName: v.stateName || '',
      });
      setArrivalNotes(v.arrivalNotes || '');
    }
  );

  if (!isOpen) return null;

  const patch = (fields) => setForm((prev) => ({ ...prev, ...fields }));
  const text = (key) => ({ value: form[key], onChange: (e) => patch({ [key]: e.target.value }) });
  const commonServices = isVenue ? COMMON_VENUE_SERVICES : COMMON_LOGISTICS_SERVICES;

  const switchCategory = (category) => {
    setListingCategory(category);
    patch({ services: [] });
  };

  const addCustomService = (e) => {
    e.preventDefault();
    const name = form.customService.trim();
    if (name && !form.services.includes(name)) patch({ services: [...form.services, name], customService: '' });
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    photos.reset();
    setArrivalNotes('');
    setArrivalPhotos([]);
    setLoading(false);
  };

  const handleFileSelect = (e) => {
    const max = isVenue ? 10 : 5;
    photos.add(e.target.files, max, `Maximum of ${max} photos allowed for VIP ${isVenue ? 'Venues' : 'Services'}.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.files.length === 0) {
      setError('Please upload at least one photograph of the listing.');
      return;
    }
    if (isVenue) {
      if (form.daysOpen.length === 0) return setError('Please select at least one operating day.');
      if (form.establishmentType === 'OTHER' && !form.customCategory.trim()) return setError('Please specify the custom category.');
    } else if (form.serviceType === 'OTHER' && !form.customServiceType.trim()) {
      return setError('Please specify the custom service type.');
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('city', form.city);
      formData.append('state', form.stateName);
      formData.append('services', JSON.stringify(form.services));
      photos.files.forEach((file) => formData.append('images', file));

      let response;
      if (isVenue) {
        formData.append('establishmentType', form.establishmentType === 'OTHER' ? form.customCategory : form.establishmentType);
        formData.append('depositAmount', form.priceAmount);
        formData.append('dressCode', form.dressCode);
        formData.append('street', form.street);
        formData.append('open', form.openTime);
        formData.append('close', form.closeTime);
        formData.append('daysOpen', JSON.stringify(form.daysOpen));
        if (arrivalNotes.trim()) formData.append('arrivalNotes', arrivalNotes.trim());
        arrivalPhotos.slice(0, 5).forEach((file) => formData.append('arrivalPhotos', file));
        response = await createVipEstablishment(formData);
      } else {
        formData.append('serviceType', form.serviceType === 'OTHER' ? form.customServiceType : form.serviceType);
        formData.append('pricePerDay', form.priceAmount);
        formData.append('street', form.street || 'Service Area');
        response = await createVipService(formData);
      }

      toast.success(isVenue ? 'Venue published. It goes live after approval.' : 'Service published. It goes live after approval.');
      clearDraft();
      setTimeout(() => {
        if (onEstablishmentAdded) onEstablishmentAdded(response.data?.data?.establishment || response.data?.data?.service);
        onClose();
        resetForm();
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish VIP listing.');
      setLoading(false);
    }
  };

  const customInput = (key, placeholder) => (
    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
      <input
        type="text" placeholder={placeholder} value={form[key]} onChange={(e) => patch({ [key]: e.target.value })}
        className={CUSTOM_INPUT} required aria-label={placeholder}
      />
    </div>
  );

  return (
    <StudioShell
      z="z-[100]"
      eyebrow="Concierge Studio"
      title="Create VIP Listing"
      onClose={onClose}
      bodyClass="space-y-10"
      formId="vip-form"
      loading={loading}
      loadingText="Publishing..."
      submitLabel={<>Publish {isVenue ? 'Venue' : 'Service'}</>}
    >
      <VipCategoryTabs value={listingCategory} onChange={switchCategory} />
      <ErrorAlert message={error} />

      <form id="vip-form" onSubmit={handleSubmit} className="space-y-12">
        <DraftBar savedAt={savedAt} onExit={onClose} onDiscard={() => { clearDraft(); resetForm(); }} />

        <section>
          <StudioSectionTitle icon={Wine}>Listing Details</StudioSectionTitle>
          <div className="space-y-6">
            <Field
              theme="studio" label={isVenue ? 'Establishment Name' : 'Service Title'} type="text" required maxLength={70}
              placeholder={isVenue ? 'e.g. The Velvet Room' : 'e.g. Elite Armed Escort Convoy'} {...text('title')}
            />
            <TextAreaField
              theme="studio" label="Description" required rows={3}
              placeholder="Describe the exclusive experience, features, and target audience..." {...text('description')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isVenue ? (
                <SelectField
                  theme="studio" label="Category" extra="cursor-pointer" {...text('establishmentType')}
                  after={form.establishmentType === 'OTHER' && customInput('customCategory', 'e.g. Golf Resort')}
                >
                  <option value="LOUNGE">Premium Lounge</option>
                  <option value="CLUB">Nightclub</option>
                  <option value="FINE_DINING">Fine Dining</option>
                  <option value="BEACH_CLUB">Beach Club</option>
                  <option value="PRIVATE_YACHT">Private Yacht</option>
                  <option value="OTHER">Other</option>
                </SelectField>
              ) : (
                <SelectField
                  theme="studio" label="Category" extra="cursor-pointer" {...text('serviceType')}
                  after={form.serviceType === 'OTHER' && customInput('customServiceType', 'e.g. VIP Event Security')}
                >
                  <option value="ARMED_ESCORT">Armed Escort</option>
                  <option value="CHAUFFEUR">Private Chauffeur</option>
                  <option value="PRIVATE_CHEF">Private Chef</option>
                  <option value="HELICOPTER_CHARTER">Helicopter Charter</option>
                  <option value="CONCIERGE">Personal Concierge</option>
                  <option value="OTHER">Other Service</option>
                </SelectField>
              )}
              {isVenue && (
                <Field
                  theme="studio" wrapperClass="animate-in fade-in" label="Dress Code" type="text" required
                  placeholder="e.g. Smart Elegant. No athletic wear." aria-label="e.g. Smart Elegant. No athletic wear." {...text('dressCode')}
                />
              )}
            </div>
          </div>
        </section>

        <StudioDivider />

        <section>
          <StudioSectionTitle icon={MapPin}>Location</StudioSectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              theme="studio" wrapperClass="md:col-span-2" label="Street Address" type="text" required={isVenue}
              placeholder={isVenue ? 'e.g. 15 Adetokunbo Ademola Street' : 'e.g. Dispatch HQ (Optional)'} {...text('street')}
            />
            <StateCityFields
              theme="studio"
              stateName={form.stateName}
              city={form.city}
              onState={(e) => patch({ stateName: e.target.value, city: '' })}
              onCity={(city) => patch({ city })}
              cityLabel="City / Base"
              stateExtra="cursor-pointer appearance-none"
              cityExtra="cursor-pointer appearance-none disabled:opacity-50"
            />
          </div>
        </section>

        <StudioDivider />

        <section>
          <StudioSectionTitle icon={Clock}>{isVenue ? 'Operations & Services' : 'Service Inclusions'}</StudioSectionTitle>

          {isVenue && (
            <div className="animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Field theme="studio" label="Opening Time" type="text" required placeholder="e.g. 10:00 PM" aria-label="e.g. 10:00 PM" {...text('openTime')} />
                <Field theme="studio" label="Closing Time" type="text" required placeholder="e.g. 04:00 AM" aria-label="e.g. 04:00 AM" {...text('closeTime')} />
              </div>
              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Operating Days</label>
                <ChipGroup style="day" items={DAYS_OF_WEEK} selected={form.daysOpen} onToggle={(d) => patch({ daysOpen: toggleItem(form.daysOpen, d) })} labelOf={(d) => d.substring(0, 3)} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              {isVenue ? 'VIP Amenities Provided' : 'What is Included?'}
            </label>
            <ChipGroup style="service" items={commonServices} selected={form.services} onToggle={(s) => patch({ services: toggleItem(form.services, s) })}>
              {form.services.filter((s) => !commonServices.includes(s)).map((service) => (
                <button key={service} type="button" onClick={() => patch({ services: toggleItem(form.services, service) })} className={CUSTOM_PILL}>
                  {service} <span className="ml-1 opacity-50 group-hover:opacity-100">✕</span>
                </button>
              ))}
            </ChipGroup>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isVenue ? 'Add custom amenity (e.g. Helipad)...' : 'Add custom inclusion (e.g. 1 SUV)...'}
                value={form.customService}
                onChange={(e) => patch({ customService: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addCustomService(e)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white"
              />
              <button
                type="button" onClick={addCustomService} disabled={!form.customService.trim()}
                className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-black transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </section>

        <StudioDivider />

        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Premium Media</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {photos.files.length} / {isVenue ? '10' : '5'} PHOTOS
            </span>
          </div>
          <QualityNotice>Upload high-resolution, vibrant photographs. The first image becomes the primary cover photo.</QualityNotice>
          <StudioPhotoDrop inputRef={fileInputRef} padding="p-10" onSelect={handleFileSelect} />
          <StudioPreviewGrid urls={photos.urls} onRemove={photos.remove} />
        </section>

        <StudioDivider />

        {isVenue && (
          <>
            <ArrivalGuideFields notes={arrivalNotes} onNotes={setArrivalNotes} photos={arrivalPhotos} onPhotos={setArrivalPhotos} label="Arrival guide" hint="Only guests with a paid booking see this: entrance, door team, parking, how to ask for their reservation." />
            <StudioDivider />
          </>
        )}

        <section className="pb-10">
          <StudioSectionTitle icon={Tags}>Pricing Configuration</StudioSectionTitle>
          <StudioPriceCard
            label={isVenue ? 'Required Deposit' : 'Daily Rate (NGN)'}
            description={isVenue ? 'Minimum spend or table deposit to secure the reservation.' : 'The base cost per day for this service.'}
            value={form.priceAmount}
            onChange={(priceAmount) => patch({ priceAmount })}
            min="20000"
            max="5000000"
            step="20000"
            footerRight={<span className="font-semibold text-gray-700">5% commission deducted from your payout</span>}
          />
        </section>
      </form>
    </StudioShell>
  );
}

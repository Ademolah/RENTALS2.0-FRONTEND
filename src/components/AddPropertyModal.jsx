import { useRef, useState } from 'react';
import { MapPin, Users, AlignLeft } from 'lucide-react';
import { createProperty } from '../api/properties';
import { useToast } from './Toast';
import { useDraft } from './host/useDraft';
import DraftBar from './host/DraftBar';
import ArrivalGuideFields from './host/ArrivalGuideFields';
import SuggestedPrice from './host/SuggestedPrice';
import { Field, TextAreaField } from './host/forms/Field';
import { ChipGroup, ErrorAlert } from './host/forms/controls';
import { toggleItem } from './host/forms/helpers';
import { StudioShell } from './host/forms/shells';
import { QualityNotice, StudioPhotoDrop, StudioPreviewGrid, StudioVideoField } from './host/forms/media';
import { useImageList, useVideoFile } from './host/forms/useMedia';
import { StateCityFields, StudioDivider, StudioPriceCard, StudioSectionTitle } from './host/forms/studio';
import { PROPERTY_AMENITIES } from './host/forms/constants';

const MAX_PHOTOS = 15;
const DEFAULT_LOADING_TEXT = 'Processing Upload...';

const DEFAULT_FORM = {
  title: '',
  description: '',
  pricePerNight: 150000,
  maxGuests: 2,
  bedrooms: 1,
  bathrooms: 1,
  street: '',
  city: '',
  stateName: '',
  amenities: [],
};

async function geocode(street, city, stateName) {
  try {
    const query = encodeURIComponent(`${street}, ${city}, ${stateName}, Nigeria`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch (geoError) {
    console.warn('Geocoding failed, proceeding with text address only', geoError);
  }
  return {};
}

export default function AddPropertyModal({ isOpen, onClose, onPropertyAdded }) {
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(DEFAULT_LOADING_TEXT);
  const [error, setError] = useState('');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [arrivalPhotos, setArrivalPhotos] = useState([]);
  const photos = useImageList(setError);
  const video = useVideoFile(setError);

  const { savedAt, clearDraft } = useDraft(
    'rentals_draft_property',
    isOpen,
    { ...form, arrivalNotes },
    (v) => {
      setForm({
        title: v.title || '',
        description: v.description || '',
        pricePerNight: v.pricePerNight ?? 150000,
        maxGuests: v.maxGuests ?? 2,
        bedrooms: v.bedrooms ?? 1,
        bathrooms: v.bathrooms ?? 1,
        street: v.street || '',
        city: v.city || '',
        stateName: v.stateName || '',
        amenities: Array.isArray(v.amenities) ? v.amenities : [],
      });
      setArrivalNotes(v.arrivalNotes || '');
    }
  );

  if (!isOpen) return null;

  const patch = (fields) => setForm((prev) => ({ ...prev, ...fields }));
  const text = (key, convert = (x) => x) => ({ value: form[key], onChange: (e) => patch({ [key]: convert(e.target.value) }) });
  const netEarnings = Math.round(form.pricePerNight * 0.95);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    photos.reset();
    video.reset();
    setLoading(false);
    setLoadingText(DEFAULT_LOADING_TEXT);
    setArrivalNotes('');
    setArrivalPhotos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.files.length === 0) {
      setError('Please upload at least one pristine photograph of the property.');
      return;
    }

    setLoading(true);
    setError('');
    setLoadingText('Locating Property...');

    try {
      const coordinates = await geocode(form.street, form.city, form.stateName);
      setLoadingText('Uploading Media & Generating Hashes...');

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', 'SHORTLET');
      formData.append('pricePerNight', form.pricePerNight);
      formData.append('maxGuests', form.maxGuests);
      formData.append('bedrooms', form.bedrooms);
      formData.append('bathrooms', form.bathrooms);
      formData.append('address', JSON.stringify({
        street: form.street, city: form.city, state: form.stateName, country: 'Nigeria', coordinates,
      }));
      form.amenities.forEach((amenity) => formData.append('amenities', amenity));
      if (video.file) formData.append('video', video.file);
      photos.files.forEach((file) => formData.append('images', file));
      if (arrivalNotes.trim()) formData.append('arrivalNotes', arrivalNotes.trim());
      arrivalPhotos.slice(0, 5).forEach((file) => formData.append('arrivalPhotos', file));

      const response = await createProperty(formData);

      toast.success('Listing published. It goes live after a quick verification.');
      clearDraft();
      setTimeout(() => {
        if (onPropertyAdded) onPropertyAdded(response.data.property);
        onClose();
        resetForm();
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish listing. Please check your inputs.');
      setLoading(false);
      setLoadingText(DEFAULT_LOADING_TEXT);
    }
  };

  return (
    <StudioShell
      z="z-50"
      eyebrow="Host Studio"
      title="Create Listing"
      onClose={onClose}
      bodyClass="space-y-12"
      formId="property-form"
      loading={loading}
      loadingText={loadingText}
      submitLabel="Publish Premium Listing"
    >
      <ErrorAlert message={error} />

      <form id="property-form" onSubmit={handleSubmit} className="space-y-12">
        <DraftBar savedAt={savedAt} onExit={onClose} onDiscard={() => { clearDraft(); resetForm(); }} />

        <section>
          <StudioSectionTitle icon={AlignLeft}>Property Essentials</StudioSectionTitle>
          <div className="space-y-6">
            <Field
              theme="studio" label="Listing Title" type="text" required maxLength={70}
              placeholder="e.g. Minimalist Luxury Suite with Lagoon View" aria-label="e.g. Minimalist Luxury Suite with Lagoon View"
              {...text('title')}
            />
            <TextAreaField
              theme="studio" label="Compelling Description" required rows={4}
              placeholder="Describe the aesthetic, vibe, and unique selling points..." {...text('description')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                theme="studio" labelExtra="flex items-center space-x-1.5"
                labelNode={<><Users className="w-4 h-4 text-gray-400" /><span>Maximum Guests</span></>}
                type="number" required min="1" max="20" {...text('maxGuests')}
              />
              <Field theme="studio" label="Bedrooms" type="number" required min="1" max="20" {...text('bedrooms', Number)} />
              <Field theme="studio" label="Bathrooms" type="number" required min="1" max="20" {...text('bathrooms', Number)} />
            </div>
          </div>
        </section>

        <StudioDivider />

        <section>
          <StudioSectionTitle icon={MapPin}>Location Details</StudioSectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              theme="studio" wrapperClass="md:col-span-2" label="Street Address" type="text" required
              placeholder="e.g. 15 Bourdillon Road" aria-label="e.g. 15 Bourdillon Road" {...text('street')}
            />
            <StateCityFields
              theme="studio"
              stateName={form.stateName}
              city={form.city}
              onState={(e) => patch({ stateName: e.target.value, city: '' })}
              onCity={(city) => patch({ city })}
              cityLabel="City / Neighborhood"
              stateExtra="cursor-pointer appearance-none"
              cityExtra="cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </section>

        <StudioDivider />

        <section>
          <StudioSectionTitle>Premium Amenities</StudioSectionTitle>
          <ChipGroup style="amenity" items={PROPERTY_AMENITIES} selected={form.amenities} onToggle={(a) => patch({ amenities: toggleItem(form.amenities, a) })} />
        </section>

        <StudioDivider />

        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Pristine Media</h3>
            <div className="flex space-x-2">
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {photos.files.length} / 15 PHOTOS
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${video.file ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {video.file ? '1 / 1 VIDEO' : 'OPTIONAL VIDEO'}
              </span>
            </div>
          </div>

          <QualityNotice>
            Upload an optional 30-second video tour and up to 15 high-resolution photographs. No watermarks, heavy filters, or renders allowed. First image becomes your cover photo.
          </QualityNotice>

          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Cinematic Video Tour (Optional)</label>
            <StudioVideoField video={video} inputRef={videoInputRef} onSelect={video.select} />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">High-Resolution Photos</label>
            <StudioPhotoDrop
              inputRef={photoInputRef}
              hint="JPEG, PNG up to 10MB each"
              onSelect={(e) => photos.add(e.target.files, MAX_PHOTOS, 'Maximum of 15 photos allowed to maintain platform standards.')}
            />
            <StudioPreviewGrid urls={photos.urls} onRemove={photos.remove} showCover />
          </div>
        </section>

        <StudioDivider />

        <ArrivalGuideFields notes={arrivalNotes} onNotes={setArrivalNotes} photos={arrivalPhotos} onPhotos={setArrivalPhotos} />

        <StudioDivider />

        <section className="pb-10">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-6">Pricing Configuration</h3>
          <StudioPriceCard
            label="Base Nightly Rate"
            description="Slide to adjust your pricing dynamically."
            value={form.pricePerNight}
            onChange={(pricePerNight) => patch({ pricePerNight })}
            min="30000"
            max="1500000"
            step="5000"
            between={<SuggestedPrice category="shortlets" state={form.stateName} area={form.city} bedrooms={Number(form.bedrooms) || undefined} onUse={(pricePerNight) => patch({ pricePerNight })} />}
            footerRight={<span className="font-semibold text-gray-700 text-lg">Net Payout: <span className="text-emerald-600 font-bold ml-1">₦{netEarnings.toLocaleString()}</span></span>}
          />
        </section>
      </form>
    </StudioShell>
  );
}

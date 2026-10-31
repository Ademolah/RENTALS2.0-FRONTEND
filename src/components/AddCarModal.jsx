import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../lib/config';
import { useToast } from './Toast';
import { useDraft } from './host/useDraft';
import DraftBar from './host/DraftBar';
import ArrivalGuideFields from './host/ArrivalGuideFields';
import { Field, SelectField, TextAreaField } from './host/forms/Field';
import { ChipGroup, ErrorAlert } from './host/forms/controls';
import { toggleItem } from './host/forms/helpers';
import { CompactShell } from './host/forms/shells';
import { useImageList, useVideoFile } from './host/forms/useMedia';
import { CarMedia, CarPriceCard, ChevronSelect } from './host/forms/CarFormParts';
import { CAR_FEATURES } from './host/forms/constants';

const MAX_PHOTOS = 10;
const SEAT_OPTIONS = [2, 4, 5, 6, 7, 8, 12, 15];
const SELECT_EXTRA = 'bg-white appearance-none cursor-pointer';
const LOCATION_SELECT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 outline-none text-base transition-colors bg-white appearance-none cursor-pointer';
const LOCATION_INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 outline-none text-base transition-colors';
const DESCRIPTION_CLASS = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400 resize-none custom-scrollbar';
const BLOCK_LABEL = 'block text-xs font-bold text-gray-700 tracking-wide mb-1 uppercase';

const thisYear = () => new Date().getFullYear();
const defaultForm = () => ({
  make: '',
  carModel: '',
  year: thisYear(),
  seatNumber: 4,
  category: 'LUXURY',
  transmission: 'AUTOMATIC',
  city: '',
  stateLocation: 'Lagos',
  pricePer12Hours: 150000,
  selectedFeatures: [],
  description: '',
});

export default function AddCarModal({ isOpen, onClose, onCarAdded }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [arrivalPhotos, setArrivalPhotos] = useState([]);
  const photos = useImageList(setError);
  const video = useVideoFile(setError);

  const { savedAt, clearDraft } = useDraft(
    'rentals_draft_car',
    isOpen,
    { ...form, arrivalNotes },
    (v) => {
      setForm({
        make: v.make || '',
        carModel: v.carModel || '',
        year: v.year ?? thisYear(),
        seatNumber: v.seatNumber ?? 4,
        category: v.category || 'LUXURY',
        transmission: v.transmission || 'AUTOMATIC',
        city: v.city || '',
        stateLocation: v.stateLocation || 'Lagos',
        pricePer12Hours: v.pricePer12Hours ?? 150000,
        selectedFeatures: Array.isArray(v.selectedFeatures) ? v.selectedFeatures : [],
        description: v.description || '',
      });
      setArrivalNotes(v.arrivalNotes || '');
    }
  );

  if (!isOpen) return null;

  const patch = (fields) => setForm((prev) => ({ ...prev, ...fields }));
  const text = (key) => ({ value: form[key], onChange: (e) => patch({ [key]: e.target.value }) });
  const numeric = (key) => ({ value: form[key], onChange: (e) => patch({ [key]: Number(e.target.value) }) });

  const discardDraft = () => {
    clearDraft();
    patch({ make: '', carModel: '', description: '', city: '', selectedFeatures: [], pricePer12Hours: 150000 });
    setArrivalNotes('');
    setArrivalPhotos([]);
  };

  const pickVideo = (e) => {
    if (video.select(e.target.files[0])) e.target.value = null;
  };

  const pickPhotos = (e) => {
    if (photos.add(e.target.files, MAX_PHOTOS, 'Maximum 10 images allowed.')) e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (photos.files.length === 0) {
      setError('Please upload at least one image of the vehicle.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('make', form.make);
      formData.append('carModel', form.carModel);
      formData.append('year', form.year.toString());
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('seatNumber', form.seatNumber.toString());
      formData.append('transmission', form.transmission);
      formData.append('pricePer12Hours', form.pricePer12Hours.toString());
      if (form.selectedFeatures.length) formData.append('features', form.selectedFeatures.join(', '));
      formData.append('location', JSON.stringify({ city: form.city, state: form.stateLocation }));
      if (video.file) formData.append('video', video.file);
      photos.files.forEach((file) => formData.append('images', file));
      if (arrivalNotes.trim()) formData.append('arrivalNotes', arrivalNotes.trim());
      arrivalPhotos.slice(0, 5).forEach((file) => formData.append('arrivalPhotos', file));

      const response = await axios.post(`${API_URL}/cars`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('rentals_token')}` },
      });

      toast.success('Vehicle added to your fleet. It goes live after approval.');
      clearDraft();
      setTimeout(() => {
        if (onCarAdded) onCarAdded(response.data.data.car);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list vehicle.');
      console.error('Error listing vehicle:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompactShell title="List Vehicle" subtitle="Add a vehicle to your fleet" onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      <ErrorAlert variant="compact" message={error} />

      <DraftBar savedAt={savedAt} onExit={onClose} onDiscard={discardDraft} />

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Vehicle Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field theme="compact" label="Make / Brand" type="text" required placeholder="Mercedes-Benz" aria-label="Mercedes-Benz" {...text('make')} />
          <Field theme="compact" label="Model" type="text" required placeholder="G63 AMG" aria-label="G63 AMG" {...text('carModel')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField theme="compact" label="Category" extra={SELECT_EXTRA} {...text('category')}>
            <option value="LUXURY">Luxury</option>
            <option value="SUV">SUV</option>
            <option value="SEDAN">Sedan</option>
            <option value="CHAUFFEUR_DRIVEN">Chauffeur Driven</option>
            <option value="VAN">Van / Bus</option>
          </SelectField>
          <SelectField theme="compact" label="Transmission" extra={SELECT_EXTRA} {...text('transmission')}>
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual</option>
          </SelectField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:col-span-2">
            <ChevronSelect label="Manufacture Year" {...numeric('year')}>
              {Array.from({ length: 15 }, (_, i) => thisYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </ChevronSelect>
            <ChevronSelect label="Seat Capacity" {...numeric('seatNumber')}>
              {SEAT_OPTIONS.map((num) => <option key={num} value={num}>{num} {num === 2 ? 'Seats (Coupe)' : 'Seats'}</option>)}
            </ChevronSelect>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase">Vehicle Features</label>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{form.selectedFeatures.length} Selected</span>
        </div>
        <ChipGroup style="feature" items={CAR_FEATURES} selected={form.selectedFeatures} onToggle={(f) => patch({ selectedFeatures: toggleItem(form.selectedFeatures, f) })} />
      </div>

      <TextAreaField
        theme="compact" labelClassName={BLOCK_LABEL} controlClassName={DESCRIPTION_CLASS} label="About This Vehicle" required rows="4"
        placeholder="Describe the vehicle's condition, specific rules, or unique selling points..." {...text('description')}
      />

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField theme="compact" controlClassName={LOCATION_SELECT} label="Operating State" {...text('stateLocation')}>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
          </SelectField>
          <Field
            theme="compact" controlClassName={LOCATION_INPUT} label="City / Area" type="text" required
            placeholder="Victoria Island" aria-label="Victoria Island" {...text('city')}
          />
        </div>
      </div>

      <CarMedia photos={photos} video={video} maxPhotos={MAX_PHOTOS} onPickVideo={pickVideo} onPickPhotos={pickPhotos} />

      <ArrivalGuideFields notes={arrivalNotes} onNotes={setArrivalNotes} photos={arrivalPhotos} onPhotos={setArrivalPhotos} label="Pickup instructions" hint="Only guests with a paid booking see this: where to meet, parking, how the handover works." />

      <CarPriceCard value={form.pricePer12Hours} onChange={(pricePer12Hours) => patch({ pricePer12Hours })} />
    </CompactShell>
  );
}

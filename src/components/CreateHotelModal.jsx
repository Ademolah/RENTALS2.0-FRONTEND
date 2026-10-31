import { useState } from 'react';
import { createHotel } from '../api/hotel';
import { useToast } from './Toast';
import { useDraft } from './host/useDraft';
import DraftBar from './host/DraftBar';
import WizardShell from './host/forms/WizardShell';
import { ProfileStep, MediaStep, RoomsStep } from './host/forms/HotelWizardSteps';
import { toggleItem } from './host/forms/helpers';

const newRoom = () => ({ name: '', pricePerNight: '', capacity: { adults: 2, children: 0 }, totalInventory: 1, amenities: [], description: '' });

const freshForm = () => ({
  title: '',
  description: '',
  hasBreakfast: false,
  category: 'HOTEL',
  address: { street: '', city: '', state: '', country: 'Nigeria' },
  amenities: [],
  images: [],
  roomTypes: [newRoom()],
});

export default function CreateHotelModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [arrivalPhotos, setArrivalPhotos] = useState([]);
  const [formData, setFormData] = useState(freshForm);
  const toast = useToast();

  const { savedAt, clearDraft } = useDraft(
    'rentals_draft_hotel',
    isOpen,
    {
      form: {
        title: formData.title,
        description: formData.description,
        hasBreakfast: formData.hasBreakfast,
        address: formData.address,
        amenities: formData.amenities,
        roomTypes: formData.roomTypes,
      },
      arrivalNotes,
    },
    (v) => {
      setFormData((prev) => ({ ...prev, ...v.form }));
      setArrivalNotes(v.arrivalNotes || '');
    }
  );

  if (!isOpen) return null;

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const setAddress = (field, value) => setFormData((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  const toggleAmenity = (name) => setFormData((prev) => ({ ...prev, amenities: toggleItem(prev.amenities, name) }));

  const addImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };
  const removeImage = (index) => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const setRoom = (index, field, value) => {
    const [parent, child] = field.split('.');
    setFormData((prev) => ({
      ...prev,
      roomTypes: prev.roomTypes.map((room, i) => {
        if (i !== index) return room;
        return child ? { ...room, [parent]: { ...room[parent], [child]: value } } : { ...room, [field]: value };
      }),
    }));
  };
  const addRoom = () => setFormData((prev) => ({ ...prev, roomTypes: [...prev.roomTypes, newRoom()] }));
  const removeRoom = (index) => {
    if (formData.roomTypes.length === 1) return;
    setFormData((prev) => ({ ...prev, roomTypes: prev.roomTypes.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.append('title', formData.title);
      body.append('description', formData.description);
      body.append('hasBreakfast', formData.hasBreakfast);
      body.append('category', 'HOTEL');
      body.append('street', formData.address.street);
      body.append('city', formData.address.city);
      body.append('state', formData.address.state);
      body.append('country', formData.address.country);
      body.append('amenities', JSON.stringify(formData.amenities));
      body.append('roomTypes', JSON.stringify(formData.roomTypes));

      // Starting price is the lowest room price (0 when none is set)
      const lowestPrice = formData.roomTypes.length > 0
        ? Math.min(...formData.roomTypes.map((r) => Number(r.pricePerNight) || 0))
        : 0;
      body.append('startingPrice', lowestPrice);

      formData.images.forEach((file) => body.append('images', file));
      if (arrivalNotes.trim()) body.append('arrivalNotes', arrivalNotes.trim());
      arrivalPhotos.slice(0, 5).forEach((file) => body.append('arrivalPhotos', file));

      const data = await createHotel(body);

      toast.success('Hotel published. It goes live after approval.');
      clearDraft();

      setTimeout(() => {
        onSuccess && onSuccess(data.data);
        onClose();
        setStep(1);
      }, 2000);
    } catch (error) {
      console.error('Hotel Creation Error:', error);
      toast.error(error.response?.data?.message || 'Failed to publish hotel profile. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const discardDraft = () => {
    clearDraft();
    setFormData(freshForm());
    setArrivalNotes('');
    setArrivalPhotos([]);
    setStep(1);
  };

  return (
    <WizardShell
      step={step}
      onStep={setStep}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      draftBar={<DraftBar savedAt={savedAt} onExit={onClose} onDiscard={discardDraft} />}
    >
      {step === 1 && (
        <ProfileStep
          form={formData}
          onField={setField}
          onAddress={setAddress}
          arrival={{ notes: arrivalNotes, onNotes: setArrivalNotes, photos: arrivalPhotos, onPhotos: setArrivalPhotos }}
        />
      )}
      {step === 2 && <MediaStep form={formData} onToggleAmenity={toggleAmenity} onAddImages={addImages} onRemoveImage={removeImage} />}
      {step === 3 && <RoomsStep form={formData} onRoom={setRoom} onAddRoom={addRoom} onRemoveRoom={removeRoom} />}
    </WizardShell>
  );
}

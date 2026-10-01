import React, { useState } from 'react';
import { 
  X, MapPin, CheckCircle2, Building, BedDouble, 
  Wifi, Droplets, Wine, Car, Coffee, Utensils, 
  Sparkles, Dumbbell, Plus, Trash2, Image as ImageIcon,
  ChevronRight, ChevronLeft, AlertCircle
} from 'lucide-react';
import { createHotel } from '../api/hotel';

const PRESET_AMENITIES = [
  { name: 'Free Wifi', icon: Wifi },
  { name: 'Swimming Pool', icon: Droplets },
  { name: 'Restaurant', icon: Utensils },
  { name: 'Fitness Center', icon: Dumbbell },
  { name: 'Bar / Lounge', icon: Wine },
  { name: 'Spa & Wellness', icon: Sparkles },
  { name: 'Valet Parking', icon: Car },
  { name: 'Room Service', icon: Coffee }
];

const INITIAL_ROOM_STATE = {
  name: '',
  pricePerNight: '',
  capacity: { adults: 2, children: 0 },
  totalInventory: 1,
  amenities: [],
  description: ''
};

export default function CreateHotelModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State mapped exactly to your Mongoose schema
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hasBreakfast: false,
    category: 'HOTEL',
    address: { street: '', city: '', state: '', country: 'Nigeria' },
    amenities: [],
    images: [], 
    roomTypes: [ { ...INITIAL_ROOM_STATE } ] 
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const toggleAmenity = (amenityName) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenityName);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== amenityName)
          : [...prev.amenities, amenityName]
      };
    });
  };

  // --- IMAGE UPLOAD HANDLERS ---
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  // --- ROOM TYPE MANAGEMENT ---
  const handleRoomChange = (index, field, value) => {
    const updatedRooms = [...formData.roomTypes];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedRooms[index][parent][child] = value;
    } else {
      updatedRooms[index][field] = value;
    }
    setFormData(prev => ({ ...prev, roomTypes: updatedRooms }));
  };

  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, { ...INITIAL_ROOM_STATE }]
    }));
  };

  const removeRoomType = (index) => {
    if (formData.roomTypes.length === 1) return; // Must have at least 1 room
    const updatedRooms = formData.roomTypes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, roomTypes: updatedRooms }));
  };

 const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('hasBreakfast', formData.hasBreakfast);
      submitData.append('category', 'HOTEL');
      
      submitData.append('street', formData.address.street);
      submitData.append('city', formData.address.city);
      submitData.append('state', formData.address.state);
      submitData.append('country', formData.address.country);

      formData.amenities.forEach(amenity => submitData.append('amenities', amenity));
      submitData.append('roomTypes', JSON.stringify(formData.roomTypes));

      // Calculate starting price dynamically from the lowest room price (fallback to 0)
      const lowestPrice = formData.roomTypes.length > 0 
        ? Math.min(...formData.roomTypes.map(r => Number(r.pricePerNight) || 0))
        : 0;
      submitData.append('startingPrice', lowestPrice);

      if (formData.images && formData.images.length > 0) {
        formData.images.forEach(file => submitData.append('images', file));
      }

      const data = await createHotel(submitData);
      
      showToast("Hotel profile published successfully!", "success");
      
      setTimeout(() => {
        onSuccess && onSuccess(data.data);
        onClose();
        setStep(1);
      }, 2000);

    } catch (error) {
      console.error("Hotel Creation Error:", error);
      const errorMsg = error.response?.data?.message || "Failed to publish hotel profile. Please check your connection.";
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER STEPS ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hotel Name</label>
        <input 
          type="text" 
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g. The Rentals Luxury Resort"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
        <textarea 
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe the hotel's vibe, audience, and unique selling points..."
          rows={4}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all resize-none"
        />
      </div>

      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-4 rounded-xl">
        <div>
          <h4 className="font-bold text-gray-900">Complimentary Breakfast</h4>
          <p className="text-xs text-gray-500 mt-0.5">Is breakfast included for all guests?</p>
        </div>
        <button 
          onClick={() => handleInputChange('hasBreakfast', !formData.hasBreakfast)}
          className={`w-14 h-8 rounded-full transition-colors relative ${formData.hasBreakfast ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${formData.hasBreakfast ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="space-y-4">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Location Details</label>
        <input 
          type="text" 
          value={formData.address.street}
          onChange={(e) => handleAddressChange('street', e.target.value)}
          placeholder="Street Address (e.g. 15 Bourdillon Rd)"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all"
        />
        <div className="flex gap-4">
          <input 
            type="text" 
            value={formData.address.city}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            placeholder="City"
            className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all"
          />
          <select 
            value={formData.address.state}
            onChange={(e) => handleAddressChange('state', e.target.value)}
            className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all cursor-pointer"
          >
            <option value="" disabled>Select State</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select Amenities</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRESET_AMENITIES.map((amenity) => {
            const isSelected = formData.amenities.includes(amenity.name);
            const Icon = amenity.icon;
            return (
              <button
                key={amenity.name}
                onClick={() => toggleAmenity(amenity.name)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all overflow-hidden ${
                  isSelected 
                    ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-[inset_0_0_0_1px_rgba(var(--brand-primary),0.2)]' 
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* Crystal clear visual indicator for selected state */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-brand-primary text-white rounded-full p-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
                <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-center">{amenity.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Property Images</label>
        
        {/* Wired up native file input wrapped in a styled label */}
        <label htmlFor="hotel-images" className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Click to upload photos</p>
          <p className="text-xs text-gray-500">Select multiple PNG or JPGs</p>
          
          <input 
            id="hotel-images"
            type="file" 
            multiple 
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden" 
            onChange={handleImageUpload}
          />
        </label>

        {/* Dynamic Image Preview Grid */}
        {formData.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
            {formData.images.map((file, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 shadow-sm">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Preview ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                />
                <button 
                  type="button"
                  onClick={() => removeImage(idx)}
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

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Configure Room Types</label>
        <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-md">
          {formData.roomTypes.length} {formData.roomTypes.length === 1 ? 'Room' : 'Rooms'} Added
        </span>
      </div>

      <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {formData.roomTypes.map((room, index) => (
          <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm relative group">
            
            {formData.roomTypes.length > 1 && (
              <button 
                onClick={() => removeRoomType(index)}
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
                type="text" 
                value={room.name}
                onChange={(e) => handleRoomChange(index, 'name', e.target.value)}
                placeholder="Room Name (e.g. Deluxe King Suite)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary"
              />
              
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price / Night (₦)</label>
                  <input 
                    type="number" 
                    value={room.pricePerNight}
                    onChange={(e) => handleRoomChange(index, 'pricePerNight', Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Inventory</label>
                  <input 
                    type="number" 
                    value={room.totalInventory}
                    onChange={(e) => handleRoomChange(index, 'totalInventory', Number(e.target.value))}
                    min="1"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Adults</label>
                  <input 
                    type="number" 
                    value={room.capacity.adults}
                    onChange={(e) => handleRoomChange(index, 'capacity.adults', Number(e.target.value))}
                    min="1"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Children</label>
                  <input 
                    type="number" 
                    value={room.capacity.children}
                    onChange={(e) => handleRoomChange(index, 'capacity.children', Number(e.target.value))}
                    min="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={addRoomType}
        className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" /> Add Another Room Type
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:h-[85vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 leading-tight">Create Hotel Profile</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full h-1 bg-gray-100 shrink-0">
          <div 
            className="h-full bg-brand-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* SCROLLABLE FORM CONTENT */}
        <div className="overflow-y-auto p-6 flex-grow">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-white border-t border-gray-100 p-4 sm:p-6 shrink-0 flex justify-between items-center pb-safe">
          <button 
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className={`font-bold px-6 py-3 rounded-xl transition-all flex items-center ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </button>
          
          {step < 3 ? (
            <button 
              onClick={() => setStep(prev => Math.min(3, prev + 1))}
              className="bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-black transition-colors flex items-center shadow-md active:scale-95"
            >
              Next Step <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-brand-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all flex items-center shadow-lg shadow-brand-primary/30 active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Hotel'}
              {!isSubmitting && <CheckCircle2 className="w-4 h-4 ml-2" />}
            </button>
          )}
        </div>

        {/* MAJESTIC TOAST NOTIFICATION */}
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ease-out ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
            toast.type === 'success' 
              ? 'bg-green-900/95 border-green-700/50 text-white shadow-green-900/20' 
              : 'bg-red-900/95 border-red-700/50 text-white shadow-red-900/20'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
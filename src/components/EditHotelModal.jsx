import React, { useState, useEffect } from 'react';
import { 
  X, Building, Loader2, CheckCircle2, AlertCircle, 
  Image as ImageIcon, Trash2, BedDouble, Plus, Wifi, 
  Droplets, Utensils, Dumbbell, Wine, Sparkles, Car, Coffee
} from 'lucide-react';
import { updateHotel, getHotelById } from '../api/hotel';

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
  amenities: []
};

export default function EditHotelModal({ isOpen, onClose, onSuccess, hotelId }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hasBreakfast: false,
    address: { street: '', city: '', state: '', country: 'Nigeria' },
    amenities: [],
    roomTypes: [],
    isAvailable: true,
    existingImages: [],
    newImages: []
  });

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const fetchHotelData = async () => {
      if (!isOpen || !hotelId) return;
      setIsLoading(true);
      try {
        const response = await getHotelById(hotelId);
        const hotel = response?.data?.hotel || response?.data?.property || response?.data; 
        
        if (hotel) {
          setFormData({
            title: hotel.title || '',
            description: hotel.description || '',
            hasBreakfast: hotel.hasBreakfast || false,
            address: {
              street: hotel.address?.street || '',
              city: hotel.address?.city || '',
              state: hotel.address?.state || '',
              country: hotel.address?.country || 'Nigeria'
            },
            amenities: hotel.amenities || [],
            roomTypes: hotel.roomTypes || [],
            isAvailable: hotel.isAvailable !== undefined ? hotel.isAvailable : true,
            existingImages: hotel.images || [],
            newImages: []
          });
        }
      } catch (error) {
        showToast("Failed to fetch current hotel data.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHotelData();
  }, [isOpen, hotelId]);

  // --- HANDLERS ---
  const toggleAmenity = (amenityName) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityName)
        ? prev.amenities.filter(a => a !== amenityName)
        : [...prev.amenities, amenityName]
    }));
  };

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
    setFormData(prev => ({ ...prev, roomTypes: [...prev.roomTypes, { ...INITIAL_ROOM_STATE }] }));
  };

  const removeRoomType = (index) => {
    if (formData.roomTypes.length === 1) return;
    setFormData(prev => ({ ...prev, roomTypes: prev.roomTypes.filter((_, i) => i !== index) }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) setFormData(prev => ({ ...prev, newImages: [...prev.newImages, ...files] }));
  };

  const removeExistingImage = (index) => {
    setFormData(prev => ({ ...prev, existingImages: prev.existingImages.filter((_, i) => i !== index) }));
  };

  const removeNewImage = (index) => {
    setFormData(prev => ({ ...prev, newImages: prev.newImages.filter((_, i) => i !== index) }));
  };

  // --- SUBMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('hasBreakfast', formData.hasBreakfast.toString()); // Backend checks === 'true'
      payload.append('isAvailable', formData.isAvailable);
      
      // Calculate starting price for validation fallback
      const lowestPrice = formData.roomTypes.length > 0 
        ? Math.min(...formData.roomTypes.map(r => Number(r.pricePerNight) || 0))
        : 0;
      payload.append('startingPrice', lowestPrice);

      // JSON Stringify complex objects to match backend JSON.parse() expectation
      payload.append('address', JSON.stringify(formData.address));
      payload.append('amenities', JSON.stringify(formData.amenities));
      payload.append('roomTypes', JSON.stringify(formData.roomTypes));
      payload.append('existingImages', JSON.stringify(formData.existingImages));

      // Append new files
      formData.newImages.forEach(file => payload.append('images', file));

      await updateHotel(hotelId, payload);
      
      showToast("Hotel updated successfully!", "success");
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update hotel.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !hotelId) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden relative flex flex-col h-[90vh]">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Manage Hotel</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Profile & Inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Hotel Specs...</p>
          </div>
        ) : (
          <form id="editHotelForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-10">
            
            {/* Basic Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">1. Profile & Location</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Hotel Name</label>
                  <input 
                    type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none"
                  />
                </div>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-xl mt-6 md:mt-0">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Free Breakfast</h4>
                    <p className="text-[10px] text-gray-500">Included for all guests</p>
                  </div>
                  <button 
                    type="button" onClick={() => setFormData({ ...formData, hasBreakfast: !formData.hasBreakfast })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.hasBreakfast ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${formData.hasBreakfast ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Street Address</label>
                  <input 
                    type="text" value={formData.address.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">State</label>
                  <select 
                    value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none appearance-none"
                  >
                    <option value="" disabled>Select State</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Amenities */}
            <section className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">2. Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESET_AMENITIES.map((amenity) => {
                  const isSelected = formData.amenities.includes(amenity.name);
                  const Icon = amenity.icon;
                  return (
                    <button
                      type="button" key={amenity.name} onClick={() => toggleAmenity(amenity.name)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        isSelected ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      {isSelected && <div className="absolute top-2 right-2 bg-brand-primary text-white rounded-full p-0.5"><CheckCircle2 className="w-3.5 h-3.5" /></div>}
                      <Icon className="w-5 h-5 mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{amenity.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Room Types */}
            <section className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">3. Room Inventory</h3>
              <div className="space-y-4">
                {formData.roomTypes.map((room, index) => (
                  <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-5 relative group">
                    {formData.roomTypes.length > 1 && (
                      <button type="button" onClick={() => removeRoomType(index)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Room Name</label>
                        <input type="text" value={room.name} onChange={(e) => handleRoomChange(index, 'name', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold" />
                      </div>
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rate (₦)</label>
                          <input type="number" value={room.pricePerNight} onChange={(e) => handleRoomChange(index, 'pricePerNight', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold" />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Rooms</label>
                          <input type="number" value={room.totalInventory} onChange={(e) => handleRoomChange(index, 'totalInventory', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addRoomType} className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <Plus className="w-4 h-4 mr-2" /> Add Room Category
                </button>
              </div>
            </section>

            {/* Images */}
            <section className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">4. Gallery</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {formData.existingImages.map((img, idx) => (
                  <div key={`old-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                    <img src={img} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.newImages.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-brand-primary shadow-sm">
                    <img src={URL.createObjectURL(file)} alt={`New ${idx}`} className="w-full h-full object-cover opacity-80" />
                    <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                  <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Upload</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </section>

          </form>
        )}

        {/* FOOTER */}
        <div className="border-t border-gray-100 p-6 shrink-0 bg-white">
          <button 
            form="editHotelForm"
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] flex justify-center items-center"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Publish Changes'}
          </button>
        </div>

        {/* TOAST */}
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 ease-out ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-green-900 text-white border-green-700' : 'bg-red-900 text-white border-red-700'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="font-bold text-xs tracking-wide">{toast.message}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
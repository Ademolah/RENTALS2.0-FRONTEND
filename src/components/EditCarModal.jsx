import React, { useState, useEffect } from 'react';
import { X, Car, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { updateCar, getCarById } from '../api/car';

export default function EditCarModal({ isOpen, onClose, onSuccess, carId }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    make: '',
    carModel: '',
    year: '',
    description: '',
    pricePer12Hours: '',
    seatNumber: '',
    features: '', 
    isAvailable: true,
    existingImages: [],
    newImages: []
  });

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const fetchCarData = async () => {
      if (!isOpen || !carId) return;
      setIsLoading(true);
      try {
        const response = await getCarById(carId);
        const car = response?.data?.car; 
        
        if (car) {
          setFormData({
            make: car.make || '',
            carModel: car.carModel || '',
            year: car.year || '',
            description: car.description || '',
            pricePer12Hours: car.pricePer12Hours || '',
            seatNumber: car.seatNumber || '',
            features: car.features ? car.features.join(', ') : '',
            isAvailable: car.isAvailable !== undefined ? car.isAvailable : true,
            existingImages: car.images || [],
            newImages: []
          });
        }
      } catch (error) {
        showToast("Failed to fetch current vehicle data.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarData();
  }, [isOpen, carId]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      setFormData(prev => ({ ...prev, newImages: [...prev.newImages, ...files] }));
    }
  };

  const removeExistingImage = (index) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  const removeNewImage = (index) => {
    setFormData(prev => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Package into FormData for backend Multer processing
      const payload = new FormData();
      payload.append('make', formData.make);
      payload.append('carModel', formData.carModel);
      payload.append('year', formData.year);
      payload.append('description', formData.description);
      payload.append('pricePer12Hours', Number(formData.pricePer12Hours));
      payload.append('seatNumber', formData.seatNumber);
      payload.append('isAvailable', formData.isAvailable);
      
      // Parse comma-separated features into an array
      const featureArray = formData.features.split(',').map(f => f.trim()).filter(Boolean);
      featureArray.forEach(f => payload.append('features', f));

      // Append old images to keep
      formData.existingImages.forEach(img => payload.append('existingImages', img));

      // Append new image files
      formData.newImages.forEach(file => payload.append('images', file));

      await updateCar(carId, payload);
      
      showToast("Vehicle updated successfully!", "success");
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update vehicle.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !carId) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Comprehensive Asset Editor</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Vehicle Specs & Pricing</p>
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Vehicle Specs...</p>
          </div>
        ) : (
          <form id="editCarForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
            
            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Make</label>
                <input 
                  type="text" value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Model</label>
                <input 
                  type="text" value={formData.carModel} onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Year</label>
                <input 
                  type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none"
                />
              </div>
            </div>

            {/* Row 2: Pricing & Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">12-Hour Rate (₦)</label>
                <input 
                  type="number" value={formData.pricePer12Hours} onChange={(e) => setFormData({ ...formData, pricePer12Hours: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Seats</label>
                <input 
                  type="number" value={formData.seatNumber} onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none"
                />
              </div>
            </div>

            {/* Row 3: Description & Features */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Features (Comma Separated)</label>
                <input 
                  type="text" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Leather Seats, V6 Engine, Tinted..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none"
                />
              </div>
            </div>

            {/* Row 4: Images */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Asset Images</label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* Existing Images */}
                {formData.existingImages.map((img, idx) => (
                  <div key={`old-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                    <img src={img} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {/* New Image Previews */}
                {formData.newImages.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-brand-primary shadow-sm">
                    <img src={URL.createObjectURL(file)} alt={`New ${idx}`} className="w-full h-full object-cover opacity-80" />
                    <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer group transition-colors">
                  <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-brand-primary mb-2" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Add Photos</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {/* Row 5: Availability Toggle */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-5 rounded-xl">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Active Listing</h4>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Toggle off to hide from marketplace</p>
              </div>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                className={`w-14 h-8 rounded-full transition-colors relative ${formData.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${formData.isAvailable ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </form>
        )}

        {/* FOOTER */}
        <div className="border-t border-gray-100 p-6 shrink-0 bg-white">
          <button 
            form="editCarForm"
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
import { useState } from 'react';
import { X, UploadCloud, AlertCircle, Sparkles, Calendar as CalendarIcon, Check } from 'lucide-react';
import { createProperty } from '../api/properties';

export default function AddPropertyModal({ isOpen, onClose, onPropertyAdded }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('apartment');
  const [location, setLocation] = useState('');
  const [pricePerNight, setPricePerNight] = useState(120000); // Default 120k NGN
  const [bedrooms, setBedrooms] = useState(1);
  const [maxGuests, setMaxGuests] = useState(2);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [images, setImages] = useState([]);

  if (!isOpen) return null;

  // Estimate net earning after platform fee (e.g. 5% platform commission)
  const netEarnings = Math.round(pricePerNight * 0.95);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        category,
        location,
        pricePerNight,
        bedrooms: Number(bedrooms),
        maxGuests: Number(maxGuests),
        availableFrom,
        availableTo,
        images: images.length > 0 ? images : [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
        ]
      };

      const newProp = await createProperty(payload);
      if (onPropertyAdded) onPropertyAdded(newProp);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit property listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-5 border-b border-gray-100">
          <div>
            <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">Landlord Studio</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-0.5">List a New Property</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          {/* STEP 1: Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Listing Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Minimalist Luxury Suite with Lagoon View"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm transition-all bg-white"
                >
                  <option value="apartment">Apartment</option>
                  <option value="shortlet">Shortlet</option>
                  <option value="vacation">Vacation Villa</option>
                  <option value="hotel">Hotel Suite</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Location / City</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Victoria Island, Lagos"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* PRISTINE MEDIA STANDARD CALLOUT */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs tracking-wide uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Pristine Media Quality Standard</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Rentals maintains a strict luxury benchmark. We only accept high-resolution (min 1920x1080), professionally lit photographs. Renderings, watermarked, or pixelated imagery will fail verification.
            </p>
            
            <div className="mt-3 border-t border-gray-700/60 pt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <UploadCloud className="w-4 h-4 text-brand-primary" />
                <span>Drag and drop high-res JPEG/PNG photos</span>
              </div>
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300 font-mono">Max 10MB each</span>
            </div>
          </div>

          {/* DYNAMIC PRICE SLIDER WITH NET REVENUE PREVIEW */}
          <div className="bg-gray-50 border border-gray-200/80 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Nightly Rate</label>
                <p className="text-xs text-gray-500">Adjust price based on demand</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-brand-dark">₦{Number(pricePerNight).toLocaleString()}</span>
                <span className="text-xs text-gray-500"> / night</span>
              </div>
            </div>

            {/* Slider */}
            <input 
              type="range" 
              min="25000" 
              max="1000000" 
              step="5000"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />

            <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-gray-200">
              <span>Platform Fee: <strong className="text-gray-700">5%</strong></span>
              <span>Estimated Net Payout: <strong className="text-emerald-600 font-bold">₦{netEarnings.toLocaleString()} / night</strong></span>
            </div>
          </div>

          {/* AVAILABILITY CALENDAR & DATES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center space-x-1">
                <CalendarIcon className="w-3.5 h-3.5 text-brand-primary" />
                <span>Available From</span>
              </label>
              <input 
                type="date" 
                required
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center space-x-1">
                <CalendarIcon className="w-3.5 h-3.5 text-brand-primary" />
                <span>Available Until</span>
              </label>
              <input 
                type="date" 
                required
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Publishing Listing...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Publish Property Listing</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
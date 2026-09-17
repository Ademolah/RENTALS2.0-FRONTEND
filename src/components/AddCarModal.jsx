import { useState } from 'react';
import { 
  X, UploadCloud, AlertCircle, CheckCircle2, 
  Car, Check, MapPin, Settings2, Image as ImageIcon 
} from 'lucide-react';
import axios from 'axios';

const BrandSuccessToast = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-brand-dark text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-brand-primary/30">
        <div className="bg-brand-primary p-1.5 rounded-full shadow-inner">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <span className="font-medium text-sm tracking-wide">{message}</span>
        <button onClick={onClose} className="pl-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


const API = import.meta.env.VITE_API_URL;

export default function AddCarModal({ isOpen, onClose, onCarAdded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showToast, setShowToast] = useState(false);

  // Form State
  const [features, setFeatures] = useState('');
  const [make, setMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState('LUXURY');
  const [transmission, setTransmission] = useState('AUTOMATIC');
  const [city, setCity] = useState('');
  const [stateLocation, setStateLocation] = useState('Lagos');
  const [pricePer12Hours, setPricePer12Hours] = useState(150000);
  const [selectedFiles, setSelectedFiles] = useState([]);

  if (!isOpen) return null;

  const netEarnings = Math.round(pricePer12Hours * 0.95);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if the current files plus the new ones exceed the 5-image limit
    if (selectedFiles.length + files.length > 5) {
      setError('Maximum 5 images allowed.');
      return;
    }
    
    // Append the new files to the existing state array
    setSelectedFiles((prev) => [...prev, ...files]);
    setError('');
    
    // Reset the input value so the user can re-upload a file they just deleted
    e.target.value = null; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedFiles.length === 0) {
      setError('Please upload at least one image of the vehicle.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('make', make);
      formData.append('carModel', carModel); 
      formData.append('year', year.toString());
      formData.append('category', category);
      formData.append('transmission', transmission);
      formData.append('pricePer12Hours', pricePer12Hours.toString());
      formData.append('features', features);
      
      formData.append('location', JSON.stringify({
        city: city,
        state: stateLocation
      }));

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await axios.post(`${API}/cars`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rentals_token')}`
        }
      });

      // 1. Trigger the bespoke success toast
      setShowToast(true);

      // 2. Delay the modal close by 2 seconds so the user can read the success message
      setTimeout(() => {
        if (onCarAdded) onCarAdded(response.data.data.car);
        setShowToast(false);
        onClose();
        // Optional: Reset form fields here if needed
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list vehicle.');
      console.error('Error listing vehicle:', err);
    } finally {
      setLoading(false); // Remove loading state immediately so the button resets while toast shows
    }
  };

  return (
    // Backdrop: Aligns to bottom on mobile, center on desktop
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      
      {/* Modal Container: Fixed max height, flex column for structural layout */}
      <div className="bg-white w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-t-[1.5rem] sm:rounded-[1.5rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        
        {/* STICKY HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">List Vehicle</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Add a vehicle to your fleet</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto flex-grow p-6 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Vehicle Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Make / Brand</label>
                <input 
                  type="text" 
                  required
                  placeholder="Mercedes-Benz"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Model</label>
                <input 
                  type="text" 
                  required
                  placeholder="G63 AMG"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm transition-colors bg-white appearance-none cursor-pointer"
                >
                  <option value="LUXURY">Luxury</option>
                  <option value="SUV">SUV</option>
                  <option value="SEDAN">Sedan</option>
                  <option value="CHAUFFEUR_DRIVEN">Chauffeur Driven</option>
                  <option value="VAN">Van / Bus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Transmission</label>
                <select 
                  value={transmission} 
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm transition-colors bg-white appearance-none cursor-pointer"
                >
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Features Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wide mb-1 uppercase">
            Vehicle Features
          </label>
          <input 
            type="text" 
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="e.g. Leather Seats, Bluetooth, Chauffeur Included" 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400"
          />
          <p className="text-[10px] text-gray-500 mt-1.5 ml-1">
            Separate multiple features with commas.
          </p>
        </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Operating State</label>
                <select 
                  value={stateLocation} 
                  onChange={(e) => setStateLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 outline-none text-sm transition-colors bg-white appearance-none cursor-pointer"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">City / Area</label>
                <input 
                  type="text" 
                  required
                  placeholder="Victoria Island"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 outline-none text-sm transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Vehicle Imagery</h3>
              <span className="text-xs text-gray-500 font-medium">
                {selectedFiles.length}/5 uploaded
              </span>
            </div>
            
            {/* Upload Dropzone - Hides smoothly when 5 images are reached */}
            {selectedFiles.length < 5 && (
              <div className="relative group">
                <input 
                  type="file" 
                  multiple 
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-gray-100 group-hover:border-gray-400 transition-colors">
                  <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-gray-700">Upload Photos</span>
                  <span className="text-xs text-gray-500 mt-1 text-center max-w-xs">
                    JPEG or PNG. High resolution strictly required.
                  </span>
                </div>
              </div>
            )}

            {/* Pristine Image Preview Grid */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`} 
                    className={`relative rounded-xl overflow-hidden border border-gray-200 group bg-gray-100 ${
                      index === 0 ? 'col-span-4 aspect-video' : 'col-span-1 aspect-square'
                    }`}
                  >
                    {/* The Image */}
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`preview-${index}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Cover Image Badge */}
                    {index === 0 && (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-900 shadow-sm">
                        Cover Image
                      </div>
                    )}

                    {/* Elegant Remove Button */}
                    <button
                      type="button"
                      onClick={(e) => removeImage(index, e)}
                      className="absolute top-3 right-3 p-1.5 bg-white/95 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4 pb-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Pricing Structure</h3>
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-semibold text-gray-700">Base 12-Hour Rate</label>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">₦{Number(pricePer12Hours).toLocaleString()}</span>
                </div>
              </div>

              <input 
                type="range" 
                min="20000" 
                max="1500000" 
                step="5000"
                value={pricePer12Hours}
                onChange={(e) => setPricePer12Hours(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />

              <div className="flex justify-between items-center text-xs pt-4 mt-4 border-t border-gray-200">
                <span className="text-gray-500">Platform Fee (5%)</span>
                <span className="font-semibold text-gray-900">Estimated Net: ₦{netEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* STICKY FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-[1.5rem]">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirm Listing</span>
              </>
            )}
          </button>
        </div>

      </div>

      <BrandSuccessToast 
        message="Vehicle successfully added to your premium fleet!" 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />
      
    </div>
  );
}
import { useState } from 'react';
import { 
  X, UploadCloud, AlertCircle, 
  Car, Check, MapPin, Settings2, Image as ImageIcon 
} from 'lucide-react';
import axios from 'axios';

export default function AddCarModal({ isOpen, onClose, onCarAdded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
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
    if (files.length > 5) {
      setError('Maximum 5 images allowed.');
      return;
    }
    setSelectedFiles(files);
    setError('');
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
      formData.append('model', carModel);
      formData.append('year', year.toString());
      formData.append('category', category);
      formData.append('transmission', transmission);
      formData.append('pricePer12Hours', pricePer12Hours.toString());
      
      formData.append('location', JSON.stringify({
        city: city,
        state: stateLocation
      }));

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await axios.post('/api/v1/cars', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (onCarAdded) onCarAdded(response.data.data.car);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list vehicle.');
    } finally {
      setLoading(false);
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
              <span className="text-xs text-gray-500">{selectedFiles.length}/5 uploaded</span>
            </div>
            
            <div className="relative group">
              <input 
                type="file" 
                multiple 
                accept="image/*"
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
    </div>
  );
}
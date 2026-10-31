import { useState, useEffect } from 'react';
import { API_URL } from '../lib/config';
import { X, AlertCircle, Check, Image as ImageIcon, Video } from 'lucide-react';
import axios from 'axios';
import { useToast } from './Toast';
import { useDraft } from './host/useDraft';
import DraftBar from './host/DraftBar';
import ArrivalGuideFields from './host/ArrivalGuideFields';



const API = API_URL;

export default function AddCarModal({ isOpen, onClose, onCarAdded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [arrivalPhotos, setArrivalPhotos] = useState([]);

  // Form State
  const [make, setMake] = useState('');
  const [seatNumber, setSeatNumber ] = useState(4)
  const [carModel, setCarModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState('LUXURY');
  const [transmission, setTransmission] = useState('AUTOMATIC');
  const [city, setCity] = useState('');
  const [stateLocation, setStateLocation] = useState('Lagos');
  const [pricePer12Hours, setPricePer12Hours] = useState(150000);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // 💡 NEW: Video State
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

  const PREDEFINED_FEATURES = [
    "Leather Seats", "Apple CarPlay", "Android Auto", "360° Camera", 
    "GPS Navigation", "Premium Audio", "Sunroof / Moonroof", "Tinted Windows", 
    "Chauffeur Included", "Armored / Bulletproof", "Wi-Fi Hotspot", "Bluetooth"
  ];

  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [description, setDescription] = useState('');

  const toggleFeature = (feat) => {
    setSelectedFeatures(prev => 
      prev.includes(feat) 
        ? prev.filter(f => f !== feat) 
        : [...prev, feat]
    );
  };

  // 💡 NEW: Cleanup video object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const { savedAt, clearDraft } = useDraft(
    'rentals_draft_car',
    isOpen,
    { make, seatNumber, carModel, year, category, transmission, city, stateLocation, pricePer12Hours, selectedFeatures, description, arrivalNotes },
    (v) => {
      setMake(v.make || '');
      setSeatNumber(v.seatNumber ?? 4);
      setCarModel(v.carModel || '');
      setYear(v.year ?? new Date().getFullYear());
      setCategory(v.category || 'LUXURY');
      setTransmission(v.transmission || 'AUTOMATIC');
      setCity(v.city || '');
      setStateLocation(v.stateLocation || 'Lagos');
      setPricePer12Hours(v.pricePer12Hours ?? 150000);
      setSelectedFeatures(Array.isArray(v.selectedFeatures) ? v.selectedFeatures : []);
      setDescription(v.description || '');
      setArrivalNotes(v.arrivalNotes || '');
    }
  );

  if (!isOpen) return null;

  const netEarnings = Math.round(pricePer12Hours * 0.95);

  // 💡 NEW: Handle Video Selection
  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Video exceeds the 50MB size limit.");
      return;
    }

    setError('');
    setSelectedVideo(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    e.target.value = null; // reset input
  };

  // 💡 NEW: Remove Video
  const removeVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedVideo(null);
    setVideoPreviewUrl(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // 💡 UPDATED: Increased to 10 images to match the backend route capability
    if (selectedFiles.length + files.length > 10) {
      setError('Maximum 10 images allowed.');
      return;
    }
    
    setSelectedFiles((prev) => [...prev, ...files]);
    setError('');
    e.target.value = null; 
  };

  // 💡 FIX: Added missing removeImage function that was causing a crash risk!
  const removeImage = (index, e) => {
    e.stopPropagation();
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
      formData.append('description', description);
      formData.append('category', category);
      formData.append('seatNumber', seatNumber.toString());
      formData.append('transmission', transmission);
      formData.append('pricePer12Hours', pricePer12Hours.toString());
      if (selectedFeatures.length) formData.append('features', selectedFeatures.join(', '));
      
      formData.append('location', JSON.stringify({
        city: city,
        state: stateLocation
      }));

      // 💡 NEW: Append video if one was selected
      if (selectedVideo) {
        formData.append('video', selectedVideo);
      }

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      if (arrivalNotes.trim()) formData.append('arrivalNotes', arrivalNotes.trim());
      arrivalPhotos.slice(0, 5).forEach((file) => formData.append('arrivalPhotos', file));

      const response = await axios.post(`${API}/cars`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rentals_token')}`
        }
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      
      <div className="bg-white w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[1.5rem] shadow-2xl animate-fade-up">
        
        {/* STICKY HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">List Vehicle</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Add a vehicle to your fleet</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
           aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto flex-grow p-6 space-y-6 custom-scrollbar">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <DraftBar savedAt={savedAt} onExit={onClose} onDiscard={() => { clearDraft(); setMake(''); setCarModel(''); setDescription(''); setCity(''); setSelectedFeatures([]); setArrivalNotes(''); setArrivalPhotos([]); setPricePer12Hours(150000); }} />

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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-base transition-colors" aria-label="Mercedes-Benz" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Model</label>
                <input 
                  type="text" 
                  required
                  placeholder="G63 AMG"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-base transition-colors" aria-label="G63 AMG" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-base transition-colors bg-white appearance-none cursor-pointer"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-base transition-colors bg-white appearance-none cursor-pointer"
                >
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:col-span-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wide mb-1 uppercase">
                    Manufacture Year
                  </label>
                  <div className="relative group">
                    <select 
                      required
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all text-gray-900 font-medium appearance-none cursor-pointer group-hover:border-gray-300"
                    >
                      {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wide mb-1 uppercase">
                    Seat Capacity
                  </label>
                  <div className="relative group">
                    <select 
                      required
                      value={seatNumber}
                      onChange={(e) => setSeatNumber(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all text-gray-900 font-medium appearance-none cursor-pointer group-hover:border-gray-300"
                    >
                      {[2, 4, 5, 6, 7, 8, 12, 15].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 2 ? 'Seats (Coupe)' : 'Seats'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Selection Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase">
                Vehicle Features
              </label>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {selectedFeatures.length} Selected
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {PREDEFINED_FEATURES.map((feat) => {
                const isSelected = selectedFeatures.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleFeature(feat)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                      isSelected 
                        ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {feat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* About This Car (Description) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wide mb-1 uppercase">
              About This Vehicle
            </label>
            <textarea 
              required
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the vehicle's condition, specific rules, or unique selling points..." 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400 resize-none custom-scrollbar"
            ></textarea>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 outline-none text-base transition-colors bg-white appearance-none cursor-pointer"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 outline-none text-base transition-colors" aria-label="Victoria Island" />
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Vehicle Imagery</h3>
              <div className="flex space-x-2">
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {selectedFiles.length} / 10 PHOTOS
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${selectedVideo ? 'bg-brand-primary/10 text-brand-dark' : 'bg-gray-100 text-gray-400'}`}>
                  {selectedVideo ? '1 / 1 VIDEO' : 'OPTIONAL VIDEO'}
                </span>
              </div>
            </div>
            
            {/* 💡 NEW: VIDEO UPLOAD SECTION */}
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide mb-2 uppercase">Cinematic Video Tour (Optional)</label>
              {!selectedVideo ? (
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="video/mp4, video/quicktime"
                    onChange={handleVideoSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-gray-100 group-hover:border-gray-400 transition-colors">
                    <Video className="w-6 h-6 text-gray-400 mb-2 group-hover:text-gray-900 transition-colors" />
                    <span className="text-sm font-semibold text-gray-700">Upload 30-second Video</span>
                    <span className="text-xs text-gray-500 mt-1 text-center max-w-xs">
                      MP4 or MOV up to 50MB.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black flex justify-center h-48 shadow-inner group">
                  <video src={videoPreviewUrl} controls className="h-full object-contain" />
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removeVideo(); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                   aria-label="Close">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-gray-900 shadow-sm uppercase tracking-wider">
                    Cinematic Tour
                  </div>
                </div>
              )}
            </div>

            {/* Upload Dropzone for Images */}
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide mb-2 uppercase">High-Resolution Photos</label>
              {selectedFiles.length < 10 && (
                <div className="relative group">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-gray-100 group-hover:border-gray-400 transition-colors">
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-2 group-hover:text-gray-900 transition-colors" />
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
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`preview-${index}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {index === 0 && (
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-gray-900 shadow-sm">
                          Cover Image
                        </div>
                      )}

                      {/* 💡 FIX: This button now triggers the newly created removeImage function */}
                      <button
                        type="button"
                        onClick={(e) => removeImage(index, e)}
                        className="absolute top-3 right-3 p-1.5 bg-white/95 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                       aria-label="Close">
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ArrivalGuideFields notes={arrivalNotes} onNotes={setArrivalNotes} photos={arrivalPhotos} onPhotos={setArrivalPhotos} label="Pickup instructions" hint="Only guests with a paid booking see this: where to meet, parking, how the handover works." />

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
                <span className="text-gray-500">Platform commission (5%)</span>
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
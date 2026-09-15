import { useState, useRef, useEffect } from 'react';
import { 
  X, UploadCloud, AlertCircle, Sparkles, 
  CheckCircle2, XCircle, Loader2, MapPin, 
  Users, AlignLeft
} from 'lucide-react';
import { createProperty } from '../api/properties';

// --- CUSTOM SUCCESS TOAST COMPONENT ---
const SuccessToast = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-gray-700">
        <div className="bg-emerald-500/20 p-1.5 rounded-full">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="font-medium text-sm tracking-wide">{message}</span>
        <button onClick={onClose} className="pl-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const AVAILABLE_AMENITIES = [
  'High-Speed WiFi', 'Swimming Pool', 'Fitness Center', '24/7 Power', 
  'Smart TV', 'Air Conditioning', 'Free Parking', 'Chef Service', 
  'Ocean View', 'Top-Tier Security', 'Daily Cleaning', 'Workspace'
];

export default function AddPropertyModal({ isOpen, onClose, onPropertyAdded }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing Upload...');
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Schema-Aligned Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('APARTMENT');
  const [pricePerNight, setPricePerNight] = useState(150000);
  const [maxGuests, setMaxGuests] = useState(2);
  
  // Address State
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  
  const [amenities, setAmenities] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // 1. Define the Location Taxonomy
  const LOCATION_DATA = {
    "Lagos": [
      "Ikoyi", "Banana Island", "Victoria Island", "Lekki Phase 1", 
      "Lekki", "Ajah", "Ikeja", "Magodo", "Maryland", "Gbagada", 
      "Surulere", "Yaba", "Festac"
    ].sort(),
    "Abuja": [
      "Asokoro", "Maitama", "Wuse 2", "Wuse", "Garki", 
      "Central Business District", "Jabi", "Utako", "Gwarinpa", 
      "Apo", "Kubwa", "Lugbe"
    ].sort()
  };

  // 2. Add this handler to reset the city if the landlord changes the state midway
  const handleStateChange = (e) => {
    setStateName(e.target.value);
    setCity(''); // Instantly clears the city so they don't submit "Lagos" with "Maitama"
  };

  useEffect(() => {
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      setError("Maximum of 10 photos allowed to maintain platform standards.");
      return;
    }
    
    setError('');
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewUrls];
    
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const toggleAmenity = (amenity) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  const netEarnings = Math.round(pricePerNight * 0.95);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please upload at least one pristine photograph of the property.");
      return;
    }

    setLoading(true);
    setError('');
    setLoadingText('Locating Property...');

    try {
      // 1. Invisible Auto-Geocoding
      let resolvedLat = undefined;
      let resolvedLng = undefined;
      
      try {
        const searchQuery = encodeURIComponent(`${street}, ${city}, ${stateName}, Nigeria`);
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`);
        const geoData = await geoRes.json();
        
        if (geoData && geoData.length > 0) {
          resolvedLat = Number(geoData[0].lat);
          resolvedLng = Number(geoData[0].lon);
        }
      } catch (geoError) {
        console.warn("Geocoding failed, proceeding with text address only", geoError);
      }

      setLoadingText('Publishing Listing...');

      // 2. Build Payload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('pricePerNight', pricePerNight);
      formData.append('maxGuests', maxGuests);
      
      formData.append('address', JSON.stringify({
        street,
        city,
        state: stateName,
        country: 'Nigeria',
        coordinates: {
          lat: resolvedLat,
          lng: resolvedLng
        }
      }));
      
      amenities.forEach(amenity => formData.append('amenities', amenity));
      selectedFiles.forEach(file => formData.append('images', file));

      // 3. API Call
      const response = await createProperty(formData);
      
      setShowToast(true);
      
      setTimeout(() => {
        if (onPropertyAdded) onPropertyAdded(response.data.property);
        setShowToast(false);
        onClose();
        resetForm();
      }, 2500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish listing. Please check your inputs.');
      setLoading(false);
      setLoadingText('Processing Upload...');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('APARTMENT');
    setPricePerNight(150000);
    setMaxGuests(2);
    setStreet('');
    setCity('');
    setStateName('');
    setAmenities([]);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setLoading(false);
    setLoadingText('Processing Upload...');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6 overflow-hidden">
        <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] max-w-4xl flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
          
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-b border-gray-100 flex justify-between items-center md:rounded-t-3xl">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-brand-primary uppercase">Host Studio</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">Create Listing</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 md:p-8 space-y-12 custom-scrollbar">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form id="property-form" onSubmit={handleSubmit} className="space-y-12">
              
              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <AlignLeft className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Property Essentials</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Listing Title</label>
                    <input 
                      type="text" required maxLength={70}
                      placeholder="e.g. Minimalist Luxury Suite with Lagoon View"
                      value={title} onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-gray-50/30 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Compelling Description</label>
                    <textarea 
                      required rows={4}
                      placeholder="Describe the aesthetic, vibe, and unique selling points..."
                      value={description} onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-gray-50/30 focus:bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category</label>
                      <select 
                        value={category} onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-gray-50/30 focus:bg-white cursor-pointer"
                      >
                        <option value="APARTMENT">Luxury Apartment</option>
                        <option value="SHORTLET">Premium Shortlet</option>
                        <option value="VACATION">Vacation Villa</option>
                        <option value="HOTEL">Boutique Hotel Suite</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Maximum Guests</span>
                      </label>
                      <input 
                        type="number" required min="1" max="20"
                        value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)}
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-gray-50/30 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Location Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Street Address</label>
                    <input 
                      type="text" required
                      placeholder="e.g. 15 Bourdillon Road"
                      value={street} onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-gray-50/30 focus:bg-white"
                    />
                  </div>

                  {/* STATE MOVED TO FIRST POSITION */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">State</label>
                    <select 
                      required
                      value={stateName} 
                      onChange={handleStateChange}
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-gray-50/30 focus:bg-white cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Select State</option>
                      {Object.keys(LOCATION_DATA).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  {/* DYNAMIC CITY DROPDOWN */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">City / Neighborhood</label>
                    <select 
                      required
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!stateName} // Locked until a state is chosen
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-gray-50/30 focus:bg-white cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>
                        {stateName ? 'Select City' : 'Select State First'}
                      </option>
                      
                      {/* Only renders the cities belonging to the chosen state */}
                      {stateName && LOCATION_DATA[stateName].map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </section>

              <hr className="border-gray-100" />

              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <Sparkles className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Premium Amenities</h3>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_AMENITIES.map(amenity => {
                    const isSelected = amenities.includes(amenity);
                    return (
                      <button
                        key={amenity} type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                          isSelected 
                            ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'
                        }`}
                      >
                        {amenity}
                      </button>
                    )
                  })}
                </div>
              </section>

              <hr className="border-gray-100" />

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Pristine Media</h3>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedFiles.length} / 10 PHOTOS
                  </span>
                </div>
                
                <div className="mb-6 p-5 rounded-2xl bg-gray-900 text-white shadow-md border border-gray-800">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-[10px] tracking-widest uppercase mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Rentals Quality Standard</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    Upload up to 10 high-resolution, professionally lit photographs. 
                    No watermarks, heavy filters, or renders allowed. First image becomes your cover photo.
                  </p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer group"
                >
                  <input 
                    type="file" multiple accept="image/jpeg, image/png, image/webp"
                    className="hidden" ref={fileInputRef} onChange={handleFileSelect}
                  />
                  <div className="p-4 bg-gray-100 group-hover:bg-white rounded-full mb-4 transition-colors shadow-sm">
                    <UploadCloud className="w-8 h-8 text-gray-600 group-hover:text-gray-900" />
                  </div>
                  <span className="text-base font-semibold text-gray-900">Click to browse or drag photos here</span>
                  <span className="text-sm text-gray-500 mt-1">JPEG, PNG up to 10MB each</span>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 shadow-sm">
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                            className="p-2 bg-white/20 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                        </div>
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-gray-900 shadow-sm">
                            COVER
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <hr className="border-gray-100" />

              <section className="pb-10">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-6">Pricing Configuration</h3>
                
                <div className="p-8 rounded-2xl border border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Base Nightly Rate</label>
                      <p className="text-sm text-gray-500">Slide to adjust your pricing dynamically.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-bold text-gray-900 tracking-tight">₦{Number(pricePerNight).toLocaleString()}</span>
                    </div>
                  </div>

                  <input 
                    type="range" 
                    min="30000" max="1500000" step="5000"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(Number(e.target.value))}
                    className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10"
                  />
                  
                  <div className="flex justify-between items-center text-sm pt-6 mt-6 border-t border-gray-200">
                    <span className="text-gray-500 font-medium">Platform Escrow Fee (5%)</span>
                    <span className="font-semibold text-gray-700 text-lg">Net Payout: <span className="text-emerald-600 font-bold ml-1">₦{netEarnings.toLocaleString()}</span></span>
                  </div>
                </div>
              </section>

            </form>
          </div>

          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-t border-gray-100 md:rounded-b-3xl flex justify-end">
            <button
              type="submit"
              form="property-form"
              disabled={loading}
              className="group relative overflow-hidden rounded-full bg-gray-900 px-10 py-4 transition-all duration-300 hover:bg-black hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none w-full md:w-auto"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <div className="relative flex items-center justify-center space-x-2 text-white">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-semibold text-sm tracking-wide">{loadingText}</span>
                  </>
                ) : (
                  <span className="font-semibold text-sm tracking-wide">Publish Premium Listing</span>
                )}
              </div>
            </button>
          </div>

        </div>
      </div>
      
      <SuccessToast 
        message="Listing published successfully! Undergoing quick verification." 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />
    </>
  );
}
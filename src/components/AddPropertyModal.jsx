import { useState, useRef, useEffect } from 'react';
import { 
  X, UploadCloud, AlertCircle, Sparkles, 
  Calendar as CalendarIcon, CheckCircle2, 
  Image as ImageIcon, XCircle, Loader2 
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

// --- MAIN MODAL COMPONENT ---
export default function AddPropertyModal({ isOpen, onClose, onPropertyAdded }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('apartment');
  const [location, setLocation] = useState('');
  const [pricePerNight, setPricePerNight] = useState(150000); // 150k NGN Default
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      setError("Maximum of 10 photos allowed.");
      return;
    }
    
    setError('');
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    
    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewUrls];
    
    URL.revokeObjectURL(newPreviews[index]); // Cleanup
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const netEarnings = Math.round(pricePerNight * 0.95); // Assuming 5% platform fee

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please upload at least one pristine photograph of the property.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use FormData to send files alongside text data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      
      // Sending address as stringified JSON to match backend controller parsing logic
      formData.append('address', JSON.stringify({
        street: location,
        city: 'Lagos', // Can be made dynamic later
        state: 'Lagos'
      }));
      
      formData.append('pricePerNight', pricePerNight);
      formData.append('availableFrom', availableFrom);
      formData.append('availableTo', availableTo);
      
      // Append each file under the 'images' key for Multer
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await createProperty(formData);
      
      // Trigger Success state
      setShowToast(true);
      
      // Notify parent dashboard and close modal after brief delay
      setTimeout(() => {
        if (onPropertyAdded) onPropertyAdded(response.data.property);
        setShowToast(false);
        onClose();
        resetForm();
      }, 2500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish listing. Please try again.');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setPricePerNight(150000);
    setAvailableFrom('');
    setAvailableTo('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6 overflow-hidden">
        <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] max-w-3xl flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
          
          {/* HEADER (Sticky) */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-6 py-5 border-b border-gray-100 flex justify-between items-center md:rounded-t-3xl">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-brand-primary uppercase">Host Studio</span>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5 tracking-tight">Create Listing</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* SCROLLABLE FORM BODY */}
          <div className="overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form id="property-form" onSubmit={handleSubmit} className="space-y-10">
              
              {/* SECTION 1: Basic Details */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-5">1. Property Essentials</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Listing Title</label>
                    <input 
                      type="text" required
                      placeholder="e.g. Minimalist Luxury Suite with Lagoon View"
                      value={title} onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category</label>
                      <select 
                        value={category} onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-white"
                      >
                        <option value="apartment">Luxury Apartment</option>
                        <option value="shortlet">Premium Shortlet</option>
                        <option value="vacation">Vacation Villa</option>
                        <option value="hotel">Boutique Hotel Suite</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Specific Location</label>
                      <input 
                        type="text" required
                        placeholder="e.g. Bourdillon, Ikoyi"
                        value={location} onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* SECTION 2: Pristine Media */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">2. Pristine Media</h3>
                  <span className="text-xs font-semibold text-gray-400">{selectedFiles.length} / 10 photos</span>
                </div>
                
                {/* Guidelines Box */}
                <div className="mb-5 p-5 rounded-2xl bg-gray-900 text-white shadow-md border border-gray-800">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-[10px] tracking-widest uppercase mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Rentals Quality Standard</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    Upload up to 10 high-resolution, professionally lit photographs. 
                    No watermarks, heavy filters, or renders allowed. First image becomes your cover photo.
                  </p>
                </div>

                {/* Upload Zone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer group"
                >
                  <input 
                    type="file" multiple accept="image/jpeg, image/png, image/webp"
                    className="hidden" ref={fileInputRef} onChange={handleFileSelect}
                  />
                  <div className="p-4 bg-gray-100 group-hover:bg-white rounded-full mb-3 transition-colors shadow-sm">
                    <UploadCloud className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Click to browse or drag photos here</span>
                  <span className="text-xs text-gray-500 mt-1">JPEG, PNG up to 10MB each</span>
                </div>

                {/* Image Previews Grid */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                            className="p-1.5 bg-white/20 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                        </div>
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-gray-900 shadow-sm">
                            COVER
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <hr className="border-gray-100" />

              {/* SECTION 3: Pricing & Availability */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-5">3. Pricing & Availability</h3>
                
                {/* Custom Slider */}
                <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 mb-6">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Base Nightly Rate</label>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-gray-900 tracking-tight">₦{Number(pricePerNight).toLocaleString()}</span>
                    </div>
                  </div>

                  <input 
                    type="range" 
                    min="30000" max="1500000" step="5000"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 pt-5 mt-4 border-t border-gray-200">
                    <span>Platform Fee (5%)</span>
                    <span className="font-semibold text-gray-700">Estimated Net Payout: <span className="text-emerald-600 font-bold ml-1">₦{netEarnings.toLocaleString()}</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center space-x-1.5">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span>Available From</span>
                    </label>
                    <input 
                      type="date" required
                      value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center space-x-1.5">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span>Available Until</span>
                    </label>
                    <input 
                      type="date" required
                      value={availableTo} onChange={(e) => setAvailableTo(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm transition-all bg-white"
                    />
                  </div>
                </div>
              </section>

            </form>
          </div>

          {/* FOOTER (Sticky) */}
          <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur-md px-6 py-5 border-t border-gray-100 md:rounded-b-3xl flex justify-end">
            <button
              type="submit"
              form="property-form"
              disabled={loading}
              className="group relative overflow-hidden rounded-full bg-gray-900 px-8 py-3.5 transition-all duration-300 hover:bg-black hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none w-full md:w-auto"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <div className="relative flex items-center justify-center space-x-2 text-white">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-semibold text-sm tracking-wide">Processing...</span>
                  </>
                ) : (
                  <span className="font-semibold text-sm tracking-wide">Publish Listing</span>
                )}
              </div>
            </button>
          </div>

        </div>
      </div>
      
      {/* Toast Rendered outside modal constraints */}
      <SuccessToast 
        message="Listing published successfully! Verification pending." 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />
    </>
  );
}
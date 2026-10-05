import { useState, useRef, useEffect } from 'react';
import { 
  X, UploadCloud, AlertCircle, CheckCircle2, 
  XCircle, Loader2, MapPin, Clock, Wine, Tags 
} from 'lucide-react';
import { getVipEstablishmentById, updateVipEstablishment } from '../api/vip';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COMMON_SERVICES = ['Bottle Service', 'Private Cabana', 'Valet Parking', 'VIP Host', 'Private Security', 'Shisha', 'Fine Dining'];

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

export default function EditVipModal({ isOpen, onClose, establishmentId, onSuccess }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [establishmentType, setEstablishmentType] = useState('LOUNGE');
  const [depositAmount, setDepositAmount] = useState(150000);
  const [dressCode, setDressCode] = useState('');
  
  // Location
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');

  // Operations
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [daysOpen, setDaysOpen] = useState([]);
  const [services, setServices] = useState([]);
  
  // Images
  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    if (isOpen && establishmentId) {
      loadEstablishmentData();
    }
  }, [isOpen, establishmentId]);

  useEffect(() => {
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const loadEstablishmentData = async () => {
    setFetching(true);
    setError('');
    try {
      const response = await getVipEstablishmentById(establishmentId);
      // SURGICAL FIX: Handle Axios nesting safely
      const est = response.data?.data?.establishment || response.data?.establishment;
      
      setTitle(est.title || '');
      setDescription(est.description || '');
      setEstablishmentType(est.establishmentType || 'LOUNGE');
      setDepositAmount(est.depositAmount || est.pricePerNight || 0);
      setDressCode(est.dressCode || '');
      
      setStreet(est.address?.street || '');
      setCity(est.address?.city || '');
      setStateName(est.address?.state || '');

      setOpenTime(est.openHours?.open || '');
      setCloseTime(est.openHours?.close || '');
      setDaysOpen(est.openHours?.daysOpen || []);
      setServices(est.services || []);
      setExistingImages(est.images || []);
      
    } catch (err) {
      setError('Failed to load establishment details.');
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen) return null;

  const handleStateChange = (e) => {
    setStateName(e.target.value);
    setCity(''); 
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + selectedFiles.length + files.length > 10) {
      setError("Maximum of 10 photos allowed.");
      return;
    }
    setError('');
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => {
      if (i === index) URL.revokeObjectURL(prev[i]);
      return i !== index;
    }));
  };

  const toggleDay = (day) => {
    setDaysOpen(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleService = (service) => {
    setServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingImages.length === 0 && selectedFiles.length === 0) {
      setError("Please upload or keep at least one photograph.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('establishmentType', establishmentType);
      formData.append('depositAmount', depositAmount);
      formData.append('dressCode', dressCode);
      
      formData.append('street', street);
      formData.append('city', city);
      formData.append('state', stateName);

      formData.append('open', openTime);
      formData.append('close', closeTime);
      formData.append('daysOpen', JSON.stringify(daysOpen));
      formData.append('services', JSON.stringify(services));
      
      formData.append('existingImages', JSON.stringify(existingImages));
      
      selectedFiles.forEach(file => formData.append('images', file));

      await updateVipEstablishment(establishmentId, formData);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update VIP listing.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
      <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] max-w-4xl flex flex-col shadow-2xl relative animate-in fade-in duration-200">
        
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-b border-gray-100 flex justify-between items-center md:rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Edit VIP Listing</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
              <p className="text-sm font-medium text-gray-500">Loading details...</p>
            </div>
          ) : (
            <form id="edit-vip-form" onSubmit={handleSubmit} className="space-y-12">
              
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" /> {error}
                </div>
              )}

              {/* Establishment Details */}
              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <Wine className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Establishment Details</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Establishment Name</label>
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Description</label>
                    <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50 resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Category</label>
                      <select value={establishmentType} onChange={(e) => setEstablishmentType(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50">
                        <option value="LOUNGE">Premium Lounge</option>
                        <option value="CLUB">Nightclub</option>
                        <option value="FINE_DINING">Fine Dining</option>
                        <option value="BEACH_CLUB">Beach Club</option>
                        <option value="PRIVATE_YACHT">Private Yacht</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Dress Code</label>
                      <input type="text" required value={dressCode} onChange={(e) => setDressCode(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50" />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Location */}
              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Location</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Street Address</label>
                    <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">State</label>
                    <select required value={stateName} onChange={handleStateChange} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50 appearance-none">
                      <option value="" disabled>Select State</option>
                      {Object.keys(LOCATION_DATA).map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">City</label>
                    <select required value={city} onChange={(e) => setCity(e.target.value)} disabled={!stateName} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50 appearance-none disabled:opacity-50">
                      <option value="" disabled>{stateName ? 'Select City' : 'Select State First'}</option>
                      {stateName && LOCATION_DATA[stateName]?.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Operations & Services */}
              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Operations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Opening Time</label>
                    <input type="text" required value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Closing Time</label>
                    <input type="text" required value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-sm bg-gray-50/50" />
                  </div>
                </div>
                <div className="mb-8">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Operating Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${daysOpen.includes(day) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}>
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Services</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SERVICES.map(service => (
                      <button key={service} type="button" onClick={() => toggleService(service)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${services.includes(service) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}>
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Photos */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Photos</h3>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {existingImages.length + selectedFiles.length} / 10
                  </span>
                </div>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                   {existingImages.map((url, idx) => (
                     <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                       <img src={url} className="w-full h-full object-cover" alt="Property" />
                       <button type="button" onClick={() => removeExistingImage(idx)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white"><XCircle className="w-8 h-8" /></button>
                     </div>
                   ))}
                   {previewUrls.map((url, idx) => (
                     <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-brand-primary group">
                       <img src={url} className="w-full h-full object-cover" alt="Preview" />
                       <div className="absolute top-2 left-2 bg-brand-primary text-white text-[9px] font-bold px-2 py-1 rounded">NEW</div>
                       <button type="button" onClick={() => removeNewFile(idx)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white"><XCircle className="w-8 h-8" /></button>
                     </div>
                   ))}
                 </div>
                 <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-semibold">Upload More Photos</span>
                 </div>
              </section>

              <hr className="border-gray-100" />

              {/* Deposit Config */}
              <section className="pb-8">
                <div className="flex items-center space-x-2 mb-6">
                  <Tags className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Deposit Configuration</h3>
                </div>
                <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Required Escrow Deposit</label>
                    </div>
                    <span className="text-3xl font-bold text-gray-900">₦{Number(depositAmount).toLocaleString()}</span>
                  </div>
                  <input type="range" min="50000" max="5000000" step="50000" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-gray-900" />
                </div>
              </section>

            </form>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-end md:rounded-b-3xl">
          <button type="submit" form="edit-vip-form" disabled={loading || fetching} className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-xl font-bold transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
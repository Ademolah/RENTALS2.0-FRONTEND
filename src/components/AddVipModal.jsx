import { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, AlertCircle, XCircle, Loader2, MapPin, Clock, Wine, Tags, ShieldCheck, Building } from 'lucide-react';
import { createVipEstablishment, createVipService } from '../api/vip';
import { useToast } from './Toast';
import { useDraft } from './host/useDraft';
import DraftBar from './host/DraftBar';
import ArrivalGuideFields from './host/ArrivalGuideFields';

// --- CUSTOM SUCCESS TOAST COMPONENT ---

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COMMON_VENUE_SERVICES = ['Bottle Service', 'Private Cabana', 'Valet Parking', 'VIP Host', 'Private Security', 'Shisha', 'Fine Dining'];
const COMMON_LOGISTICS_SERVICES = ['Armed Guards', 'Armored Vehicle', 'Advance Route Planning', '24/7 Availability', 'Dedicated Driver', 'Bilingual Staff'];

export default function AddVipModal({ isOpen, onClose, onEstablishmentAdded }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [arrivalPhotos, setArrivalPhotos] = useState([]);

  // 💡 NEW: Listing Category Toggle ('VENUE' | 'SERVICE')
  const [listingCategory, setListingCategory] = useState('VENUE');

  // Schema-Aligned Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Venue State
  const [establishmentType, setEstablishmentType] = useState('LOUNGE');
  const [customCategory, setCustomCategory] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [openTime, setOpenTime] = useState('10:00 PM');
  const [closeTime, setCloseTime] = useState('04:00 AM');
  const [daysOpen, setDaysOpen] = useState(['Thursday', 'Friday', 'Saturday', 'Sunday']);
  
  // Service State
  const [serviceType, setServiceType] = useState('ARMED_ESCORT');
  const [customServiceType, setCustomServiceType] = useState('');

  // Shared Pricing State (Used as depositAmount for Venues, pricePerDay for Services)
  const [priceAmount, setPriceAmount] = useState(150000);
  
  // Shared Inclusions State (services array)
  const [services, setServices] = useState([]);
  const [customService, setCustomService] = useState(''); 

  // Address State
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Location Taxonomy 
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

  const handleStateChange = (e) => {
    setStateName(e.target.value);
    setCity(''); 
  };

  useEffect(() => {
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  // Reset category-specific arrays when switching tabs
  useEffect(() => {
    setServices([]);
  }, [listingCategory]);

  const { savedAt, clearDraft } = useDraft(
    'rentals_draft_vip',
    isOpen,
    { listingCategory, title, description, establishmentType, customCategory, dressCode, openTime, closeTime, daysOpen, serviceType, customServiceType, priceAmount, services, street, stateName, city, arrivalNotes },
    (v) => {
      setListingCategory(v.listingCategory || 'VENUE');
      setTitle(v.title || '');
      setDescription(v.description || '');
      setEstablishmentType(v.establishmentType || 'LOUNGE');
      setCustomCategory(v.customCategory || '');
      setDressCode(v.dressCode || '');
      setOpenTime(v.openTime || '10:00 PM');
      setCloseTime(v.closeTime || '04:00 AM');
      setDaysOpen(Array.isArray(v.daysOpen) ? v.daysOpen : ['Thursday', 'Friday', 'Saturday', 'Sunday']);
      setServiceType(v.serviceType || 'ARMED_ESCORT');
      setCustomServiceType(v.customServiceType || '');
      setPriceAmount(v.priceAmount ?? 150000);
      setStreet(v.street || '');
      setStateName(v.stateName || '');
      setCity(v.city || '');
      setArrivalNotes(v.arrivalNotes || '');
      // The category effect clears services when it changes, so restore them afterwards.
      setTimeout(() => setServices(Array.isArray(v.services) ? v.services : []), 0);
    }
  );

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = listingCategory === 'VENUE' ? 10 : 5;
    
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Maximum of ${maxFiles} photos allowed for VIP ${listingCategory === 'VENUE' ? 'Venues' : 'Services'}.`);
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

  const toggleDay = (day) => {
    setDaysOpen(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleService = (service) => {
    setServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]);
  };

  const addCustomService = (e) => {
    e.preventDefault();
    if (customService.trim() && !services.includes(customService.trim())) {
      setServices(prev => [...prev, customService.trim()]);
      setCustomService('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please upload at least one photograph of the listing.");
      return;
    }
    
    if (listingCategory === 'VENUE') {
      if (daysOpen.length === 0) return setError("Please select at least one operating day.");
      if (establishmentType === 'OTHER' && !customCategory.trim()) return setError("Please specify the custom category.");
    } else {
      if (serviceType === 'OTHER' && !customServiceType.trim()) return setError("Please specify the custom service type.");
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('city', city);
      formData.append('state', stateName);
      formData.append('services', JSON.stringify(services));
      selectedFiles.forEach(file => formData.append('images', file));

      let response;

      // 💡 NEW: Dynamic Payload Construction based on Category
      if (listingCategory === 'VENUE') {
        formData.append('establishmentType', establishmentType === 'OTHER' ? customCategory : establishmentType);
        formData.append('depositAmount', priceAmount);
        formData.append('dressCode', dressCode);
        formData.append('street', street);
        formData.append('open', openTime);
        formData.append('close', closeTime);
        formData.append('daysOpen', JSON.stringify(daysOpen));
        if (arrivalNotes.trim()) formData.append('arrivalNotes', arrivalNotes.trim());
        arrivalPhotos.slice(0, 5).forEach(file => formData.append('arrivalPhotos', file));
        
        response = await createVipEstablishment(formData);
      } else {
        formData.append('serviceType', serviceType === 'OTHER' ? customServiceType : serviceType);
        formData.append('pricePerDay', priceAmount);
        formData.append('street', street || 'Service Area'); // Optional for services
        
        response = await createVipService(formData);
      }
      
      toast.success(listingCategory === 'VENUE' ? 'Venue published. It goes live after approval.' : 'Service published. It goes live after approval.');
      clearDraft();
      
      setTimeout(() => {
        if (onEstablishmentAdded) {
          // Send back the newly created doc to immediately render it
          onEstablishmentAdded(response.data?.data?.establishment || response.data?.data?.service);
        }
        onClose();
        resetForm();
      }, 2500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish VIP listing.');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEstablishmentType('LOUNGE');
    setServiceType('ARMED_ESCORT');
    setCustomCategory('');
    setCustomServiceType('');
    setPriceAmount(150000);
    setDressCode('');
    setOpenTime('10:00 PM');
    setCloseTime('04:00 AM');
    setDaysOpen(['Thursday', 'Friday', 'Saturday', 'Sunday']);
    setServices([]);
    setCustomService('');
    setStreet('');
    setCity('');
    setStateName('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setArrivalNotes('');
    setArrivalPhotos([]);
    setLoading(false);
  };

  const currentCommonServices = listingCategory === 'VENUE' ? COMMON_VENUE_SERVICES : COMMON_LOGISTICS_SERVICES;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6 overflow-hidden">
        <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] max-w-4xl flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
          
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-b border-gray-100 flex justify-between items-center md:rounded-t-3xl">
            <div>
              <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">Concierge Studio</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">Create VIP Listing</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
             aria-label="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
            
            {/* 💡 NEW: Segmented Control for Venue vs Service */}
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex space-x-1 shadow-inner border border-gray-200 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setListingCategory('VENUE')}
                  className={`flex-1 md:flex-none flex justify-center items-center space-x-2 px-6 py-3 rounded-xl text-xs md:text-sm font-black tracking-widest uppercase transition-all duration-300 ${
                    listingCategory === 'VENUE' 
                      ? 'bg-black text-amber-400 shadow-md' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>VIP Venue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListingCategory('SERVICE')}
                  className={`flex-1 md:flex-none flex justify-center items-center space-x-2 px-6 py-3 rounded-xl text-xs md:text-sm font-black tracking-widest uppercase transition-all duration-300 ${
                    listingCategory === 'SERVICE' 
                      ? 'bg-black text-amber-400 shadow-md' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>VIP Service</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form id="vip-form" onSubmit={handleSubmit} className="space-y-12">
              <DraftBar savedAt={savedAt} onExit={onClose} onDiscard={() => { clearDraft(); resetForm(); }} />
              
              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <Wine className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Listing Details</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      {listingCategory === 'VENUE' ? 'Establishment Name' : 'Service Title'}
                    </label>
                    <input 
                      type="text" required maxLength={70}
                      placeholder={listingCategory === 'VENUE' ? "e.g. The Velvet Room" : "e.g. Elite Armed Escort Convoy"}
                      value={title} onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Description</label>
                    <textarea 
                      required rows={3}
                      placeholder="Describe the exclusive experience, features, and target audience..."
                      value={description} onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Dropdown (Dynamic based on Category) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category</label>
                      {listingCategory === 'VENUE' ? (
                        <>
                          <select 
                            value={establishmentType} onChange={(e) => setEstablishmentType(e.target.value)}
                            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white cursor-pointer"
                          >
                            <option value="LOUNGE">Premium Lounge</option>
                            <option value="CLUB">Nightclub</option>
                            <option value="FINE_DINING">Fine Dining</option>
                            <option value="BEACH_CLUB">Beach Club</option>
                            <option value="PRIVATE_YACHT">Private Yacht</option>
                            <option value="OTHER">Other</option>
                          </select>
                          {establishmentType === 'OTHER' && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                              <input 
                                type="text" placeholder="e.g. Golf Resort" 
                                value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-white"
                                required={establishmentType === 'OTHER'} aria-label="e.g. Golf Resort" />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <select 
                            value={serviceType} onChange={(e) => setServiceType(e.target.value)}
                            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white cursor-pointer"
                          >
                            <option value="ARMED_ESCORT">Armed Escort</option>
                            <option value="CHAUFFEUR">Private Chauffeur</option>
                            <option value="PRIVATE_CHEF">Private Chef</option>
                            <option value="HELICOPTER_CHARTER">Helicopter Charter</option>
                            <option value="CONCIERGE">Personal Concierge</option>
                            <option value="OTHER">Other Service</option>
                          </select>
                          {serviceType === 'OTHER' && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                              <input 
                                type="text" placeholder="e.g. VIP Event Security" 
                                value={customServiceType} onChange={(e) => setCustomServiceType(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-white"
                                required={serviceType === 'OTHER'} aria-label="e.g. VIP Event Security" />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Venue Only: Dress Code */}
                    {listingCategory === 'VENUE' && (
                      <div className="animate-in fade-in">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Dress Code</label>
                        <input 
                          type="text" required
                          placeholder="e.g. Smart Elegant. No athletic wear."
                          value={dressCode} onChange={(e) => setDressCode(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white" aria-label="e.g. Smart Elegant. No athletic wear." />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Location</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Street Address</label>
                    <input 
                      type="text" required={listingCategory === 'VENUE'}
                      placeholder={listingCategory === 'VENUE' ? "e.g. 15 Adetokunbo Ademola Street" : "e.g. Dispatch HQ (Optional)"}
                      value={street} onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">State</label>
                    <select 
                      required
                      value={stateName} 
                      onChange={handleStateChange}
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Select State</option>
                      {Object.keys(LOCATION_DATA).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">City / Base</label>
                    <select 
                      required
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!stateName} 
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="" disabled>{stateName ? 'Select City' : 'Select State First'}</option>
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
                  <Clock className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                    {listingCategory === 'VENUE' ? 'Operations & Services' : 'Service Inclusions'}
                  </h3>
                </div>

                {/* Venue Only: Times and Days */}
                {listingCategory === 'VENUE' && (
                  <div className="animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Opening Time</label>
                        <input 
                          type="text" required placeholder="e.g. 10:00 PM"
                          value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white" aria-label="e.g. 10:00 PM" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Closing Time</label>
                        <input 
                          type="text" required placeholder="e.g. 04:00 AM"
                          value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white" aria-label="e.g. 04:00 AM" />
                      </div>
                    </div>

                    <div className="mb-8">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Operating Days</label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => {
                          const isSelected = daysOpen.includes(day);
                          return (
                            <button
                              key={day} type="button" onClick={() => toggleDay(day)}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                                isSelected ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'
                              }`}
                            >
                              {day.substring(0, 3)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Common: Service Inclusions (Pills) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    {listingCategory === 'VENUE' ? 'VIP Amenities Provided' : 'What is Included?'}
                  </label>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentCommonServices.map(service => {
                      const isSelected = services.includes(service);
                      return (
                        <button
                          key={service} type="button" onClick={() => toggleService(service)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border ${
                            isSelected ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'
                          }`}
                        >
                          {service}
                        </button>
                      )
                    })}

                    {services.filter(s => !currentCommonServices.includes(s)).map(service => (
                      <button 
                        key={service} type="button" onClick={() => toggleService(service)} 
                        className="px-4 py-2 rounded-full text-xs font-semibold transition-all border bg-gray-900 text-white border-gray-900 hover:bg-red-600 hover:border-red-600 group shadow-md flex items-center"
                      >
                        {service} <span className="ml-1 opacity-50 group-hover:opacity-100">✕</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={listingCategory === 'VENUE' ? "Add custom amenity (e.g. Helipad)..." : "Add custom inclusion (e.g. 1 SUV)..."}
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomService(e)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white"
                    />
                    <button 
                      type="button" 
                      onClick={addCustomService}
                      disabled={!customService.trim()}
                      className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Premium Media</h3>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedFiles.length} / {listingCategory === 'VENUE' ? '10' : '5'} PHOTOS
                  </span>
                </div>
                
                <div className="mb-6 p-5 rounded-2xl bg-gray-900 text-white shadow-md border border-gray-800">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs tracking-widest uppercase mb-2">
                    <span>Rentals Quality Standard</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    Upload high-resolution, vibrant photographs. The first image becomes the primary cover photo.
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
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <hr className="border-gray-100" />

              {listingCategory === 'VENUE' && (
                <>
                  <ArrivalGuideFields notes={arrivalNotes} onNotes={setArrivalNotes} photos={arrivalPhotos} onPhotos={setArrivalPhotos} label="Arrival guide" hint="Only guests with a paid booking see this: entrance, door team, parking, how to ask for their reservation." />
                  <hr className="border-gray-100" />
                </>
              )}

              <section className="pb-10">
                <div className="flex items-center space-x-2 mb-6">
                  <Tags className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Pricing Configuration</h3>
                </div>
                
                <div className="p-8 rounded-2xl border border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                        {listingCategory === 'VENUE' ? 'Required Deposit' : 'Daily Rate (NGN)'}
                      </label>
                      <p className="text-sm text-gray-500">
                        {listingCategory === 'VENUE' 
                          ? 'Minimum spend or table deposit to secure the reservation.' 
                          : 'The base cost per day for this service.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-bold text-gray-900 tracking-tight">₦{Number(priceAmount).toLocaleString()}</span>
                    </div>
                  </div>

                  <input 
                    type="range" 
                    min="20000" max="5000000" step="20000"
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(Number(e.target.value))}
                    className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10"
                  />
                  
                  <div className="flex justify-between items-center text-sm pt-6 mt-6 border-t border-gray-200">
                    <span className="text-gray-500 font-medium">Platform commission (5%)</span>
                    <span className="font-semibold text-gray-700">5% commission deducted from your payout</span>
                  </div>
                </div>
              </section>

            </form>
          </div>

          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-t border-gray-100 md:rounded-b-3xl flex justify-end">
            <button
              type="submit"
              form="vip-form"
              disabled={loading}
              className="group relative overflow-hidden rounded-full bg-gray-900 px-10 py-4 transition-all duration-300 hover:bg-black hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none w-full md:w-auto"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <div className="relative flex items-center justify-center space-x-2 text-white">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-semibold text-sm tracking-wide">Publishing...</span>
                  </>
                ) : (
                  <span className="font-semibold text-sm tracking-wide">Publish {listingCategory === 'VENUE' ? 'Venue' : 'Service'}</span>
                )}
              </div>
            </button>
          </div>

        </div>
      </div>
      
      
    </>
  );
}
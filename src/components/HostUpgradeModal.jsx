import { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, Clock, XCircle, Building, MapPin, CreditCard } from 'lucide-react';
import { HostService } from '../api/host';

export default function HostUpgradeModal({ isOpen, onClose }) {
  // 'IDLE' | 'LOADING' | 'PENDING' | 'REJECTED'
  const [appStatus, setAppStatus] = useState('IDLE'); 
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    nin: ''
  });

  
  useEffect(() => {
    const fetchStatus = async () => {
      if (isOpen) {
        setAppStatus('LOADING');
        setError('');
        setFormData({ address: '', city: '', state: '', nin: '' });
        
        try {
          const res = await HostService.checkStatus();
          const dbStatus = res.data?.status || 'IDLE';
          
          if (dbStatus === 'APPROVED') {
            onClose(); // If they are somehow already approved, just close it
          } else {
            setAppStatus(dbStatus);
            // If rejected, inject the exact reason the admin typed!
            if (dbStatus === 'REJECTED' && res.data?.notes) {
              setError(res.data.notes);
            }
          }
        } catch (err) {
          setAppStatus('IDLE'); // Fallback to the form if the network fails
        }
      }
    };

    fetchStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAppStatus('LOADING');
    setError('');

    try {
      await HostService.applyToHost(formData);
      setAppStatus('PENDING');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      
      // Auto-detect if they already have a pending application
      if (errorMsg.toLowerCase().includes('already have a pending')) {
        setAppStatus('PENDING');
      } else {
        setAppStatus('REJECTED');
        setError(errorMsg);
      }
    }
  };

  const handleTryAgain = () => {
    setAppStatus('IDLE');
    setError('');
    setFormData({ ...formData, nin: '' }); // Clear NIN as it's usually the failure point
  };

  // --- UI STATES ---

  const renderPendingState = () => (
    <div className="py-8 px-4 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Clock className="w-10 h-10 text-amber-500" />
      </div>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Application Under Review</h3>
      <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto mb-8">
        Your portfolio application is currently being evaluated by our concierge team. We will notify you via email once your landlord status is verified.
      </p>
      <button 
        onClick={onClose}
        className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold text-sm transition-all"
      >
        Return to Dashboard
      </button>
    </div>
  );

  const renderRejectedState = () => (
    <div className="py-8 px-4 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Verification Failed</h3>
      <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto mb-2">
        We were unable to upgrade your account at this time. The National Identification Number (NIN) provided could not be verified or was incorrect.
      </p>
      {error && <p className="text-xs font-bold text-red-500 mt-2 mb-6">Error: {error}</p>}
      
      <div className="flex w-full space-x-3 mt-4">
        <button 
          onClick={onClose}
          className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold text-sm transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleTryAgain}
          className="flex-1 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-gray-900/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const renderFormState = () => (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 pr-6">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Host Portfolio.
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium leading-relaxed">
          Upgrade your account to list premium properties and vehicles. We require identity verification to maintain the exclusivity of our platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Street Address */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center">
            <Building className="w-3 h-3 mr-1.5" /> Residential Address
          </label>
          <input 
            type="text" 
            name="address" 
            required 
            value={formData.address} 
            onChange={handleChange} 
            placeholder="e.g. 15 Admiralty Way" 
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all" 
          />
        </div>

        {/* City & State Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center">
              <MapPin className="w-3 h-3 mr-1.5" /> City
            </label>
            <input 
              type="text" 
              name="city" 
              required 
              value={formData.city} 
              onChange={handleChange} 
              placeholder="e.g. Lekki" 
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">
              State
            </label>
            <select 
                name="state" 
                required 
                value={formData.state} 
                onChange={handleChange} 
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all"
                >
                <option value="" disabled>Select State</option>
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
            </select>
          </div>
        </div>

        {/* NIN Verification */}
        <div className="pt-2">
          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center">
            <CreditCard className="w-3 h-3 mr-1.5" /> National ID (NIN)
          </label>
          <div className="relative">
            <input 
              type="text" 
              name="nin" 
              required 
              maxLength="11"
              value={formData.nin} 
              onChange={handleChange} 
              placeholder="Enter 11-digit NIN" 
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all tracking-widest" 
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
              <ShieldCheck className="w-3 h-3 mr-1" /> Secure
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={appStatus === 'LOADING'} 
          className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-gray-900/20 flex items-center justify-center mt-6 active:scale-[0.98]"
        >
          {appStatus === 'LOADING' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-[440px] w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        </button>

        {appStatus === 'IDLE' || appStatus === 'LOADING' ? renderFormState() : null}
        {appStatus === 'PENDING' ? renderPendingState() : null}
        {appStatus === 'REJECTED' ? renderRejectedState() : null}

      </div>
    </div>
  );
}
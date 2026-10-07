import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const [dialCode, setDialCode] = useState('+234');
  const [localPhone, setLocalPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phoneNumber:'', role: 'USER' 
  });

  if (!isOpen) return null;

  const handleLocalPhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.startsWith('0')) val = val.substring(1);
    setLocalPhone(val);
    handleChange({ target: { name: 'phoneNumber', value: `${dialCode}${val}` } });
  };

  const handleDialCodeChange = (e) => {
    const code = e.target.value;
    setDialCode(code);
    handleChange({ target: { name: 'phoneNumber', value: `${code}${localPhone}` } });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        const { confirmPassword, ...apiData } = formData;
        await register(apiData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  // Teleport the modal directly into the document body to bypass all z-index stacking issues
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-[420px] w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="mb-6 pr-6">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {isLogin ? 'Welcome back.' : 'Create account.'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 font-medium">
            {isLogin ? 'Enter details to access your itinerary.' : 'Join Rentals to experience premium hospitality.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-start">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">Account Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'USER' })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      formData.role === 'USER' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'LANDLORD' })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      formData.role === 'LANDLORD' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Landlord
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">First Name</label>
                  <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">Last Name</label>
                  <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">Phone Number</label>
                  <div className="flex">
                    <select value={dialCode} onChange={handleDialCodeChange} className="px-2 py-3 bg-gray-50 border border-gray-200 rounded-l-xl border-r-0 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-bold text-gray-700 cursor-pointer transition-all">
                      <option value="+234">🇳🇬 +234</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <input type="tel" required value={localPhone} onChange={handleLocalPhoneChange} placeholder="803 000 0000" className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-r-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all" />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">Email Address</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="name@example.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Password</label>
              {isLogin && <button type="button" className="text-[10px] font-bold text-brand-primary hover:underline">Forgot?</button>}
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all pr-12" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-gray-900/20 flex items-center justify-center mt-2 active:scale-[0.98]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button type="button" onClick={toggleMode} className="font-bold text-gray-900 hover:text-brand-primary transition-colors ml-1">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
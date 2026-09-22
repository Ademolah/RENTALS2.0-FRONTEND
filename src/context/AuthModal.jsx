import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  // Defaulting to Nigeria (+234) based on your platform's core market
  const [dialCode, setDialCode] = useState('+234');
  const [localPhone, setLocalPhone] = useState('');

  // Smart handler for the text input
  const handleLocalPhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Strip non-numeric characters
    
    // Automatically remove leading zero
    if (val.startsWith('0')) {
      val = val.substring(1);
    }
    
    setLocalPhone(val);

    // Create a synthetic event to perfectly match your existing handleChange logic
    handleChange({
      target: {
        name: 'phoneNumber',
        value: `${dialCode}${val}`
      }
    });
  };

  // Smart handler for the dial code dropdown
  const handleDialCodeChange = (e) => {
    const code = e.target.value;
    setDialCode(code);
    
    handleChange({
      target: {
        name: 'phoneNumber',
        value: `${code}${localPhone}`
      }
    });
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber:'',
    role: 'USER' // Options: 'USER' (Guest), 'LANDLORD'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-brand-dark">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin ? 'Log in to manage bookings and reservations' : 'Join Rentals to experience premium hospitality'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  {/* Fixed label from 'Last Name' to 'Phone Number' */}
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <div className="flex">
                    {/* Dial Code Dropdown */}
                    <select
                      value={dialCode}
                      onChange={handleDialCodeChange}
                      className="px-3 py-3 border border-gray-300 rounded-l-xl border-r-0 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm bg-gray-50 text-gray-700 font-medium cursor-pointer"
                    >
                      <option value="+234">🇳🇬 +234</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+27">🇿🇦 +27</option>
                      <option value="+254">🇰🇪 +254</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>

                    {/* Phone Digits Input */}
                    <input
                      type="tel"
                      required
                      value={localPhone}
                      onChange={handleLocalPhoneChange}
                      placeholder="803 000 0000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  
                  {/* Optional: Hidden input to ensure formData.phoneNumber is always submitted if using standard form actions */}
                  <input type="hidden" name="phoneNumber" value={formData.phoneNumber} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Account Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'USER' })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      formData.role === 'USER' ? 'bg-white shadow text-brand-dark' : 'text-gray-500'
                    }`}
                  >
                    Guest / Booker
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'LANDLORD' })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      formData.role === 'LANDLORD' ? 'bg-white shadow text-brand-dark' : 'text-gray-500'
                    }`}
                  >
                    Landlord / Host
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold transition-colors shadow-md flex items-center justify-center mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="font-semibold text-brand-primary hover:underline ml-1"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
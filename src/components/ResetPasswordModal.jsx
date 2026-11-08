import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { resetPasswordApi } from '../api/auth';

export default function ResetPasswordModal({ isOpen, email, onClose }) {
  const [otpCode, setOtpCode] = useState('');
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters long and contain at least one letter and one number.");
      return;
    }

    try {
      setLoading(true);
      // 💡 Submit the new signature: email, token (OTP), new password
      await resetPasswordApi(email, otpCode, formData.password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-900 text-center tracking-tight mb-2">
            Create New Password
          </h2>
          
          {success ? (
            <div className="text-center mt-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-8">
                Your password has been reset successfully. You can now log into your Rentals Africa account.
              </p>
              <button 
                onClick={onClose}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all active:scale-[0.98]"
              >
                Log In Now
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-500 text-center mb-8">
                We sent a 6-digit code to <span className="font-bold text-gray-900">{email}</span>. Enter it below with your new password.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-start animate-in fade-in">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 💡 INJECTED: 6-Digit OTP Field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
                    6-Digit Recovery Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-center text-xl tracking-[0.5em] font-black text-gray-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" 
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all pr-12" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirm ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" 
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all pr-12" 
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading} 
                  className="w-full py-4 bg-brand-primary hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center mt-2 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure My Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
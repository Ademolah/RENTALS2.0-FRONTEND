import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { resetPasswordApi } from '../api/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing recovery token. Please request a new password reset link.");
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError("Missing recovery token.");
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
      await resetPasswordApi(token, formData.password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden flex flex-col justify-center items-center p-4">
      <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-brand-primary/20 blur-3xl" />
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-elevated overflow-hidden relative">

        <div className="p-8 sm:p-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-glow">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-brand-dark text-center tracking-tight mb-2">
            Create New Password
          </h2>
          
          {success ? (
            <div className="text-center mt-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-base text-brand-text-secondary mb-8">
                Your password has been reset successfully. You can now log into your Rentals Africa account.
              </p>
              <Link 
                to="/"
                className="w-full inline-flex items-center justify-center bg-brand-primary text-white text-base font-semibold py-4 rounded-xl hover:bg-brand-hover transition-all active:scale-[0.98]"
              >
                Return to Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          ) : (
            <>
              <p className="text-base text-brand-text-secondary text-center mb-8">
                Your new password must be at least 8 characters long and include a number and a letter.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-semibold flex items-start animate-in fade-in">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      required 
                      value={formData.password} 
                      onChange={handleChange} 
                      placeholder="••••••••" 
                      disabled={!token || loading}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-base transition-all pr-12" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirm ? "text" : "password"} 
                      name="confirmPassword" 
                      required 
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      placeholder="••••••••" 
                      disabled={!token || loading}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-base transition-all pr-12" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirm(!showConfirm)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !token} 
                  className="w-full py-4 bg-brand-primary hover:opacity-90 text-white rounded-xl font-semibold text-base transition-all shadow-glow flex items-center justify-center mt-2 active:scale-[0.98] disabled:opacity-50"
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
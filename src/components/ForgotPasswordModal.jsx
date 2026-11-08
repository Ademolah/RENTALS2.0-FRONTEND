import React, { useState } from 'react';
import { X, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { forgotPasswordApi } from '../api/auth';
import ResetPasswordModal from './ResetPasswordModal'; // 💡 We will create this next

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  if (!isOpen) return null;

  // 💡 When OTP is sent, we transition to the Reset Password Modal
  if (showResetModal) {
    return (
      <ResetPasswordModal 
        isOpen={showResetModal}
        email={email} // 💡 Pass the email forward
        onClose={() => {
          setShowResetModal(false);
          onClose();
        }}
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setIsLoading(true);
      await forgotPasswordApi(email);
      // 💡 Transition to OTP entry modal
      setShowResetModal(true); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send recovery code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-4 w-0.5 bg-brand-primary"></div>
            <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-[0.25em]">
              Account Recovery
            </span>
          </div>

          <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Reset your password
          </h3>
          
          <p className="text-sm font-medium text-gray-500 mb-8">
            Enter the email address associated with your Rentals Africa account, and we'll send you a 6-digit secure code to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                  placeholder="guest@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 animate-in fade-in">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-gray-900 text-white font-bold text-sm py-4 rounded-xl hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-900/20 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send Recovery Code
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={onBackToLogin}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Wait, I remember my password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { X, Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { forgotPasswordApi } from '../api/auth';

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSuccess(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-200">
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-brand-text-muted hover:text-brand-dark hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-4 w-0.5 bg-brand-primary"></div>
            <span className="text-xs font-display font-bold text-brand-primary uppercase tracking-[0.2em]">
              Account Recovery
            </span>
          </div>

          <h3 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-2">
            Reset your password
          </h3>
          
          {success ? (
            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-display font-bold text-brand-dark mb-2">Check your inbox</h4>
              <p className="text-base text-brand-text-secondary leading-relaxed mb-8">
                We've sent a secure recovery link to <span className="text-brand-dark font-bold">{email}</span>. The link will expire in 15 minutes.
              </p>
              <button 
                onClick={handleClose}
                className="w-full bg-brand-dark text-white text-base font-semibold py-4 rounded-xl hover:bg-brand-accent transition-all active:scale-[0.98]"
              >
                Close Window
              </button>
            </div>
          ) : (
            <>
              <p className="text-base text-brand-text-secondary mb-8">
                Enter the email address associated with your Rentals Africa account, and we'll send you a secure link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-brand-text-muted" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                      placeholder="guest@example.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-lg border border-red-100 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center bg-brand-primary text-white font-semibold text-base py-4 rounded-xl hover:bg-brand-hover transition-all active:scale-[0.98] shadow-glow disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Send Recovery Link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button 
                  onClick={onBackToLogin}
                  className="text-sm font-semibold text-brand-text-secondary hover:text-brand-dark transition-colors"
                >
                  Wait, I remember my password
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
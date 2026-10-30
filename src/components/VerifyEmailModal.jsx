import React, { useState, useEffect, useRef } from 'react';
import { verifyEmailApi } from '../api/auth';
import { useToast } from './Toast';



export const VerifyEmailModal = ({ isOpen, onClose, email, onSuccess, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const inputRefs = useRef([]);
  const toast = useToast();
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setResending(true);
    try {
      await onResend();
      setTimeLeft(15 * 60);
      setCooldown(30);
      setError(null);
      toast.success('A new code is on its way to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'We could not resend the code. Please try again.');
    }
    setResending(false);
  };

  // 15-Minute Countdown Timer
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset timer when modal opens
    setTimeLeft(15 * 60); 
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle OTP Input Changes
  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return; // Only allow numbers

    const newOtp = [...otp];
    // Take only the last character to prevent multi-character bugs
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle Backspace for Auto-focus Previous
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle Paste Event (allows users to paste the 6-digit code directly)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().slice(0, 6).split('');
    
    // Check if pasted content is numbers only
    if (pasteData.some(isNaN)) return;

    const newOtp = [...otp];
    pasteData.forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus the last filled input
    const focusIndex = pasteData.length < 6 ? pasteData.length : 5;
    inputRefs.current[focusIndex].focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await verifyEmailApi(email, otpCode);
      // Pass the token and user data back to the parent to complete login
      onSuccess(response.token, response.data.user);
    } catch (err) {
      const backendMessage = err.response?.data?.message || 'Invalid or expired verification code. Please try again.';
      
      setError(backendMessage);
      // Vibrate input boxes on error (handled via CSS class below)
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.join('').length === 6) {
      handleSubmit();
    }
  }, [otp]);

  // Format Time for Display
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-5 bg-brand-primary-soft rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-display font-bold text-brand-dark mb-2">Check your email</h2>
          <p className="text-base text-brand-text-secondary leading-relaxed">
            We sent a 6-digit verification code to <br />
            <span className="font-medium text-brand-dark">{email}</span>
          </p>
        </div>

        {/* Input & Form Section */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={isLoading}
                className="w-14 h-16 text-center text-3xl font-display font-bold text-brand-dark bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <p className="text-base text-red-500 text-center mb-4 font-medium animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-semibold text-base transition-all hover:bg-brand-hover shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Verify Account'
            )}
          </button>

          {/* Footer Timer / Resend Section */}
          <div className="mt-8 text-center text-base space-y-2">
            <p className="text-brand-text-secondary">
              {timeLeft > 0 ? (
                <>Code expires in <span className="font-semibold text-brand-dark">{formattedTime}</span></>
              ) : (
                'Your code has expired.'
              )}
            </p>
            <p className="text-brand-text-secondary">
              Did not get it?{' '}
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0 || resending}
                className="font-semibold text-brand-primary hover:underline disabled:text-brand-text-muted disabled:no-underline"
              >
                {resending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
};
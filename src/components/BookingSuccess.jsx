import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, CalendarCheck, Home, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  
  // Paystack appends ?reference=XXX or ?trxref=XXX to the callbackUrl
  const reference = searchParams.get('reference') || searchParams.get('trxref') || 'Processing...';

  // Optional: Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCopy = () => {
    if (reference && reference !== 'Processing...') {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Main Card */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
          
          {/* Animated Success Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8 animate-in zoom-in duration-500 delay-150">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-70 duration-1000" />
            <div className="relative bg-green-500 text-white w-full h-full rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 border-4 border-white">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
            Reservation Secured
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Your payment was successful and your booking is confirmed. We have sent the receipt and check-in details to your email.
          </p>

          {/* Reference Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gray-900" />
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5 ml-2">
              Transaction Reference
            </span>
            <div className="flex items-center justify-between ml-2">
              <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">
                {reference}
              </span>
              <button 
                onClick={handleCopy}
                className="p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                title="Copy Reference"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link 
              to="/dashboard/bookings" 
              className="w-full flex items-center justify-center bg-gray-900 text-white font-bold text-sm py-4 rounded-xl hover:bg-black transition-all shadow-md group"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              View My Bookings
              <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </Link>
            
            <Link 
              to="/" 
              className="w-full flex items-center justify-center bg-white border border-gray-200 text-gray-700 font-bold text-sm py-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-8 flex items-center justify-center space-x-2 text-gray-400 animate-in fade-in duration-1000 delay-300">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Secured by Rentals Africa 
          </span>
        </div>
      </div>
    </main>
  );
}
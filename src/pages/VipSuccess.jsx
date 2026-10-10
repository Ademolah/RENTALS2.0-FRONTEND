import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Crown, CheckCircle2, ArrowRight, 
  ShieldCheck, Mail, Loader2 
} from 'lucide-react';

export default function VipSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || 'VIP-SECURED';
  
  const [verifying, setVerifying] = useState(true);

  // Simulate a brief verification pause for dramatic, premium effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full"></div>
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-6 relative z-10" />
        <p className="text-amber-500/80 font-bold uppercase tracking-[0.25em] text-xs relative z-10 animate-pulse">
          Securing Payment...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Digital VIP Pass Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Shine Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center">
                <Crown className="w-10 h-10 text-amber-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50" />
              </div>
            </div>
            
            <h1 className="text-3xl font-black text-white tracking-tight mb-3">Reservation Secured</h1>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              Your VIP experience is locked in. Your deposit has been securely placed in our platform escrow.
            </p>
          </div>

          <div className="space-y-4 mb-10">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reference ID</span>
              <span className="text-sm font-bold text-amber-500 tracking-wider">{reference}</span>
            </div>
            
            <div className="flex items-start space-x-3 text-left p-4">
              <Mail className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-gray-200">Confirmation Sent</h4>
                <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">
                  We have dispatched your digital itinerary and receipt to your email. Check your inbox.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-left p-4">
              <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-gray-200">Escrow Protected</h4>
                <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">
                  Funds remain secured until you tap "Confirm Arrival" on your dashboard at the venue.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              <span>Return Home</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
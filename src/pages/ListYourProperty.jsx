import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Car, 
  ShieldCheck, 
  Banknote, 
  Users, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';

export default function ListProperty() {
  const navigate = useNavigate();
  
  // Earnings Calculator State
  const [assetType, setAssetType] = useState('shortlet'); // 'shortlet' | 'car'
  const [estimatedNights, setEstimatedNights] = useState(15);
  const [nightlyRate, setNightlyRate] = useState(85000); // Default NGN
  
  // Active FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Dynamic Earning Calculation
  const monthlyEarnings = estimatedNights * nightlyRate;
  const annualEarnings = monthlyEarnings * 12;

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleStartListing = () => {
    // Route seamlessly to Landlord / Host Dashboard
    navigate('/dashboard/landlord');
  };

  const faqs = [
    {
      q: "How does Rentals Africa verify guests and renters?",
      a: "Every guest must undergo mandatory government-issued ID verification and biometric face-matching before completing any booking. VIP services and high-end vehicle rentals require additional background clearance."
    },
    {
      q: "How and when do I get paid?",
      a: "Payouts are automatically processed directly to your bank account 24 hours after your guest checks in or takes delivery of the vehicle, backed by our escrow protection workflow."
    },
    {
      q: "What host protection and insurance do I have?",
      a: "Rentals Africa provides host cover up to ₦50,000,000 for property damage, along with verified security deposits collected from guests prior to arrival."
    },
    {
      q: "Can I list luxury cars or VIP security vehicles?",
      a: "Yes! Rentals Africa hosts shortlets, boutique hotels, luxury SUVs, sports cars, and private security escorts. You maintain full control over pricing and availability schedules."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      
      {/* 1. HERO SECTION WITH BACKGROUND GLOW */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden bg-gradient-to-b from-gray-50/80 to-white">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-widest">
                <span>Earn on Your Terms</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
                Turn your properties and cars into <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-600">extraordinary income.</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Join thousands of verified hosts across Lagos and Abuja listing shortlets, boutique apartments, luxury vehicle fleets, and VIP escorts.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleStartListing}
                  className="w-full sm:w-auto px-9 py-4 bg-brand-primary hover:bg-brand-hover text-white text-base font-bold rounded-2xl shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all duration-300 transform active:scale-95 flex items-center justify-center space-x-3"
                >
                  <span>Start Hosting Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 text-xs font-semibold text-gray-500 py-2">
                  <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Host" />
                    <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Host" />
                    <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Host" />
                  </div>
                  <span>Over 2,400+ Active Hosts</span>
                </div>
              </div>
            </div>

            {/* Right Card Column: Interactive EARNINGS CALCULATOR */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 p-6 sm:p-8 relative">
                
                <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Estimate Earnings</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Calculate your monthly return</p>
                  </div>
                  
                  {/* Category Switcher */}
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => { setAssetType('shortlet'); setNightlyRate(85000); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        assetType === 'shortlet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      Shortlet
                    </button>
                    <button
                      onClick={() => { setAssetType('car'); setNightlyRate(60000); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        assetType === 'car' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      Car Rental
                    </button>
                  </div>
                </div>

                {/* Earnings Output */}
                <div className="text-center py-4 bg-gray-50/80 rounded-2xl mb-6 border border-gray-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Estimated Monthly Earnings</span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1">
                    ₦{monthlyEarnings.toLocaleString()}
                  </div>
                  <span className="text-xs font-medium text-emerald-600 mt-1 block">
                    ~ ₦{annualEarnings.toLocaleString()} projected annually
                  </span>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  {/* Days / Nights Occupied */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                      <span>{assetType === 'shortlet' ? 'Nights booked per month:' : 'Days rented per month:'}</span>
                      <span className="text-brand-primary">{estimatedNights} {assetType === 'shortlet' ? 'nights' : 'days'}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={estimatedNights} 
                      onChange={(e) => setEstimatedNights(Number(e.target.value))}
                      className="w-full accent-brand-primary h-2 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Daily Rate Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                      <span>{assetType === 'shortlet' ? 'Average Nightly Rate:' : 'Average Daily Rental Rate:'}</span>
                      <span className="text-brand-primary">₦{nightlyRate.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="20000" 
                      max="500000" 
                      step="5000"
                      value={nightlyRate} 
                      onChange={(e) => setNightlyRate(Number(e.target.value))}
                      className="w-full accent-brand-primary h-2 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleStartListing}
                  className="w-full mt-8 py-4 bg-gray-900 hover:bg-black text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98]"
                >
                  List Your Asset
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. WHY HOST WITH US - FEATURE GRID */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Designed for luxury, safety, and seamless operations.
            </h2>
            <p className="text-gray-500 text-base mt-4 font-medium">
              We take care of the heavy lifting so you can focus on maximizing your rental yields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-gray-50/70 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Guest Verification</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Every reservation requires verified identity checks, face recognition, and corporate screening for maximum host safety.
              </p>
            </div>

            <div className="bg-gray-50/70 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Escrow Protected Payouts</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Funds are held in secure escrow and released directly to your preferred Nigerian bank account 24 hours post check-in.
              </p>
            </div>

            <div className="bg-gray-50/70 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Full Calendar Autonomy</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Set custom pricing, minimum stay rules, and instantly sync availability across platforms with our host controls.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. STEP-BY-STEP ONBOARDING */}
      <section className="py-20 bg-gray-50/60 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Simple Process</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">How to start hosting in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative z-10">
              <span className="text-5xl font-black text-gray-200 block mb-4">01</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Create Your Listing</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Add photos, set nightly pricing, list your amenities, and specify rules for shortlets or car rentals.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative z-10">
              <span className="text-5xl font-black text-gray-200 block mb-4">02</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Accept Verified Bookings</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Review guest profiles or enable Instant Book to automatically accept verified guests.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative z-10">
              <span className="text-5xl font-black text-gray-200 block mb-4">03</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Receive Direct Payouts</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Get paid straight into your bank account with automated invoices and detailed earnings reports.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Your questions, answered</h2>
            <p className="text-gray-500 text-sm font-medium mt-2">Everything you need to know about listing with Rentals Africa</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-gray-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex justify-between items-center p-6 text-left font-bold text-gray-900 hover:bg-gray-50/50 transition-colors"
                >
                  <span className="text-base pr-4">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-sm text-gray-600 font-medium leading-relaxed animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. BOTTOM CALL TO ACTION */}
      <section className="py-16 bg-gray-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to unlock new revenue from your assets?
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-8 font-medium">
            Join Rentals Africa today and start hosting shortlets or vehicles in minutes.
          </p>
          <button
            onClick={handleStartListing}
            className="px-9 py-4 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 inline-flex items-center space-x-2"
          >
            <span>Create Your First Listing</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

    </div>
  );
}
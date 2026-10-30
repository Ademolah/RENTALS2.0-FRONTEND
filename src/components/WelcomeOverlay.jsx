import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

export default function WelcomeOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenOverlay = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenOverlay) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenWelcome', 'true');
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-dark/70 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[400px] w-full overflow-hidden shadow-elevated animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
            alt="Premium Hospitality"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-full flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 -mt-4 relative text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary mb-2">
            Premium Hospitality
          </p>
          <h2 className="text-2xl font-display font-bold text-brand-dark tracking-tight mb-2">
            Welcome to Rentals
          </h2>
          <p className="text-sm text-brand-text-secondary leading-relaxed mb-5">
            Discover verified apartments, luxury shortlets, and
            top-tier hotels across Nigeria.
          </p>
          <button
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-hover text-white py-3.5 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98]"
          >
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

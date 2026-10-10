import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 transition-all duration-700">
      <div className="bg-white rounded-[24px] max-w-[360px] sm:max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700 ease-out">
        
        {/* Editorial Image Header */}
        <div className="relative h-48 sm:h-56 w-full bg-gray-100">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" 
            alt="Premium Hospitality" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Elegant fade from image to the white content block below */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent"></div>
          
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-all active:scale-95 z-20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Concierge Content Section */}
        <div className="px-6 pb-8 pt-2 sm:px-8 sm:pb-10 text-center relative z-10">
          
          {/* Luxury Eyebrow Text */}
          <div className="flex items-center justify-center space-x-3 mb-5">
            <div className="h-[1px] w-6 bg-brand-primary/50"></div>
            <span className="text-brand-primary text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.3em]">
              Concierge Access
            </span>
            <div className="h-[1px] w-6 bg-brand-primary/50"></div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Welcome to Rentals
          </h2>
          <p className="text-gray-500 text-sm sm:text-base font-medium mb-8 leading-relaxed">
            The home of premium hospitality. Discover verified apartments, luxury shortlets, and top-tier hotels.
          </p>
          
          <button 
            onClick={handleClose}
            className="w-full py-4 bg-brand-primary hover:opacity-90 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-brand-primary/25"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
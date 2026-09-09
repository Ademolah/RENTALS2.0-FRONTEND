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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="text-center mt-4">
          <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h2 className="text-3xl font-bold text-brand-dark mb-4 tracking-tight">
            Welcome to Rentals
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            The home of premium hospitality. Discover verified apartments, luxury shortlets, and top-tier hotels.
          </p>
          <button 
            onClick={handleClose}
            className="w-full py-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleFavoriteApi } from '../api/user'; // Adjust path as needed

export default function PropertyCard({ property }) {
  const { user, setShowAuthModal } = useAuth();
  
  // Check if the current user has this property in their favorites array
  const initialFavorited = user?.favoriteProperties?.includes(property.id || property._id) || false;
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  
  // Elegant local toast state
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
    // Reduced from 4000ms to 2500ms for a snappier premium feel
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  const handleHeartClick = async (e) => {
    e.preventDefault(); 

    // 1. Unauthenticated Intercept
    if (!user) {
      showToast("Kindly log in to add this to your saved stays.");
      
      // Delay the modal opening until the toast finishes its graceful exit
      setTimeout(() => {
        if (setShowAuthModal) setShowAuthModal(true); 
      }, 2800); // 2500ms for toast + 300ms to allow the fade-out CSS animation to clear
      
      return;
    }

    // 2. Role Intercept 
    if (user.role !== 'USER') {
      showToast("Only guest accounts can save properties.");
      return;
    }

    // 3. Optimistic UI Toggle 
    const previousState = isFavorited;
    setIsFavorited(!previousState);

    try {
      // 4. Background API Call
      await toggleFavoriteApi(property.id || property._id);
    } catch (error) {
      setIsFavorited(previousState);
      showToast("Failed to update saved stays. Please try again.");
    }
  };  

  return (
    <>
      <Link to={`/property/${property.id || property._id}`} className="group cursor-pointer flex flex-col gap-3">
        {/* Image Container */}
        <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-gray-200">
          <img 
            src={property.image || property.images?.[0]} 
            alt={property.title} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Top Badges overlay */}
          <div className="absolute top-3 w-full px-3 flex justify-between items-start">
            <div className="flex flex-col gap-2">
              {/* 'R' Verified Badge */}
              {(property.isRentalVerified ?? true) && (
                <div className="bg-white/95 backdrop-blur-sm shadow-sm px-2 py-1 rounded-md flex items-center space-x-1">
                  <span className="text-brand-primary font-bold text-sm leading-none">R</span>
                  <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Verified</span>
                </div>
              )}
            </div>

            {/* Favorite Button */}
            <button 
              type="button"
              onClick={handleHeartClick}
              className="text-white hover:scale-110 transition-transform drop-shadow-md z-10"
            >
              <Heart 
                className={`w-6 h-6 transition-colors duration-300 ${
                  isFavorited 
                    ? "fill-brand-primary stroke-brand-primary" 
                    : "fill-black/20 stroke-white stroke-[1.5]"
                }`} 
              />
            </button>
          </div>
        </div>

        {/* Property Details */}
        <div className="flex flex-col text-brand-dark">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-[15px] leading-tight truncate pr-4">
              {property.location || `${property.address?.city}, ${property.address?.state}`}
            </h3>
            <div className="flex items-center space-x-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-brand-dark text-brand-dark" />
              <span className="text-sm">{property.rating || '5.0'}</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm truncate">{property.title}</p>
          <p className="text-gray-500 text-sm">{property.dates}</p>
          <div className="mt-1 flex items-center space-x-1">
            <span className="font-semibold">₦{Number(property.price || property.pricePerNight || 0).toLocaleString()}</span>
            <span className="text-gray-800 text-sm">night</span>
          </div>
        </div>
      </Link>

      {/* Global Fixed Toast for Unauthenticated Users */}
      {toast.visible && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 font-medium text-sm tracking-wide whitespace-nowrap">
            <AlertCircle className="w-5 h-5 text-brand-primary" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
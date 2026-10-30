import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleFavoriteApi } from '../api/user';

export default function PropertyCard({ property }) {
  const { user, setShowAuthModal } = useAuth();
  const initialFavorited = user?.favoriteProperties?.includes(property.id || property._id) || false;
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  const handleHeartClick = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Sign in to save this listing.");
      setTimeout(() => { if (setShowAuthModal) setShowAuthModal(true); }, 2800);
      return;
    }
    if (user.role !== 'USER') {
      showToast("Only guest accounts can save properties.");
      return;
    }
    const previousState = isFavorited;
    setIsFavorited(!previousState);
    try {
      await toggleFavoriteApi(property.id || property._id);
    } catch {
      setIsFavorited(previousState);
      showToast("Failed to update. Please try again.");
    }
  };

  return (
    <>
      <Link to={`/property/${property.id || property._id}`} className="group cursor-pointer flex flex-col gap-2.5">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
          <img
            src={property.image || property.images?.[0]}
            alt={property.title}
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-3 w-full px-3 flex justify-between items-start">
            <div>
              {(property.isRentalVerified ?? true) && (
                <div className="bg-white/95 backdrop-blur-sm shadow-sm px-2 py-1 rounded-lg flex items-center space-x-1">
                  <span className="text-brand-primary font-display font-bold text-sm leading-none">R</span>
                  <span className="text-[9px] font-bold text-brand-dark uppercase tracking-wider">Verified</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleHeartClick}
              className="hover:scale-110 transition-transform drop-shadow-md z-10"
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

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-display font-semibold text-[15px] leading-tight text-brand-dark truncate">
              {property.location || `${property.address?.city}, ${property.address?.state}`}
            </h3>
            {property.numReviews > 0 ? (
              <div className="flex items-center space-x-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-brand-dark text-brand-dark" />
                <span className="text-sm font-semibold">{(property.rating || 0).toFixed(1)}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 shrink-0">
                <Star className="w-3.5 h-3.5 text-brand-text-muted fill-brand-text-muted/20" />
                <span className="text-sm font-medium text-brand-text-muted">New</span>
              </div>
            )}
          </div>
          <p className="text-brand-text-secondary text-sm truncate">{property.title}</p>
          <p className="text-brand-text-muted text-sm">{property.dates}</p>
          <div className="mt-1.5 flex items-baseline space-x-1">
            <span className="font-display font-bold text-brand-dark">₦{Number(property.price || property.pricePerNight || 0).toLocaleString()}</span>
            <span className="text-brand-text-secondary text-sm">/ night</span>
          </div>
        </div>
      </Link>

      {/* Toast */}
      {toast.visible && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-brand-dark text-white px-5 py-3 rounded-2xl shadow-elevated flex items-center space-x-3 font-medium text-sm tracking-wide whitespace-nowrap">
            <AlertCircle className="w-5 h-5 text-brand-primary" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}

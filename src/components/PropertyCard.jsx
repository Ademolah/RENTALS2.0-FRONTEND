import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleFavoriteApi } from '../api/user';

export default function PropertyCard({ property }) {
  const { user, setShowAuthModal } = useAuth();
  const initialFavorited = user?.favoriteProperties?.includes(property.id || property._id) || false;
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [imgIdx, setImgIdx] = useState(0);

  const images = property.images?.length > 0
    ? property.images
    : [property.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'];

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

  const nextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % images.length);
  };

  const prevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <>
      <Link to={`/property/${property.id || property._id}`} className="group cursor-pointer flex flex-col">
        {/* Image carousel */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          <img
            src={images[imgIdx]}
            alt={property.title}
            className="object-cover w-full h-full transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04]"
            loading="lazy"
          />

          {/* Carousel arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <ChevronLeft className="w-4 h-4 text-brand-dark" />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <ChevronRight className="w-4 h-4 text-brand-dark" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                {images.slice(0, 5).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      i === imgIdx ? 'bg-white w-2.5' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-3 w-full px-3 flex justify-between items-start">
            <div>
              {(property.isRentalVerified ?? true) && (
                <div className="bg-white shadow-sm px-2 py-1 rounded-md flex items-center gap-1">
                  <span className="text-brand-primary font-display font-bold text-sm leading-none">R</span>
                  <span className="text-[9px] font-bold text-brand-dark uppercase tracking-wider">Verified</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleHeartClick}
              className="hover:scale-110 active:scale-95 transition-transform z-10"
            >
              <Heart
                className={`w-6 h-6 drop-shadow transition-colors duration-200 ${
                  isFavorited
                    ? "fill-brand-primary stroke-brand-primary"
                    : "fill-black/30 stroke-white stroke-[1.5]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col pt-3">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-display font-semibold text-[15px] leading-snug text-brand-dark truncate">
              {property.location || `${property.address?.city}, ${property.address?.state}`}
            </h3>
            {property.numReviews > 0 ? (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-brand-dark text-brand-dark" />
                <span className="text-sm font-medium text-brand-dark">{(property.rating || 0).toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-[13px] text-brand-text-muted shrink-0">New</span>
            )}
          </div>
          <p className="text-brand-text-secondary text-[13px] mt-0.5 truncate">{property.title}</p>
          <p className="text-brand-text-muted text-[13px]">{property.dates}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display font-bold text-[15px] text-brand-dark">₦{Number(property.price || property.pricePerNight || 0).toLocaleString()}</span>
            <span className="text-brand-text-muted text-[13px]">night</span>
          </div>
        </div>
      </Link>

      {/* Toast */}
      {toast.visible && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-fade-up">
          <div className="bg-brand-dark text-white px-5 py-3 rounded-xl shadow-elevated flex items-center gap-3 font-medium text-sm whitespace-nowrap">
            <AlertCircle className="w-4 h-4 text-brand-primary" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}

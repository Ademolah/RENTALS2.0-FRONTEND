import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SWIPE_THRESHOLD_PX = 50;

// Shows one photo at a time. Arrows (or a swipe on touch screens) move between photos.
export default function ImageGallery({ images = [], alt = 'Gallery', onImageClick, className = '', children }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const hasMultiple = images.length > 1;

  // Start from the first photo when the page moves to a different listing
  useEffect(() => { setIndex(0); }, [images[0]]);

  const showPrev = () => setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const showNext = () => setIndex((prev) => (prev + 1) % images.length);

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || !hasMultiple) return;
    const distance = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (distance > SWIPE_THRESHOLD_PX) showPrev();
    else if (distance < -SWIPE_THRESHOLD_PX) showNext();
  };

  const arrowClass = 'absolute top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full shadow-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={handleTouchEnd}
    >
      {images.length > 0 && (
        <img
          key={images[index]}
          src={images[index]}
          alt={`${alt} - ${index + 1}`}
          onClick={onImageClick ? () => onImageClick(index) : undefined}
          className={`absolute inset-0 w-full h-full object-cover animate-in fade-in duration-300 ${onImageClick ? 'cursor-pointer' : ''}`}
        />
      )}

      {children}

      {hasMultiple && (
        <>
          <button onClick={showPrev} aria-label="Previous photo" className={`${arrowClass} left-3 md:left-4`}>
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={showNext} aria-label="Next photo" className={`${arrowClass} right-3 md:right-4`}>
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="absolute top-4 right-4 z-20 bg-gray-900/70 text-white text-xs font-bold px-3 py-1 rounded-full pointer-events-none">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

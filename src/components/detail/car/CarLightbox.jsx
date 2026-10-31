import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Full-screen photo viewer. `onChange` is the state setter for the open photo index (null closes it).
export default function CarLightbox({ images, index, onChange }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') onChange((prev) => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      if (e.key === 'Escape') onChange(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChange, images.length]);

  const next = () => onChange((prev) => (prev + 1) % images.length);
  const prev = () => onChange((p) => (p === 0 ? images.length - 1 : p - 1));

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200"
      onClick={() => onChange(null)}
    >
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full">
          {index + 1} / {images.length}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          className="text-white hover:bg-white/20 bg-white/10 rounded-full p-2.5 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative w-full max-w-7xl px-4 flex items-center justify-center">
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 md:left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
            aria-label="Previous"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <img
          src={images[index]}
          alt="Expanded view"
          className="max-h-[85vh] max-w-full object-contain select-none rounded-xl shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        />

        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 md:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
            aria-label="Next"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSwipe } from '../detailUtils';

// Full-screen photo viewer with touch swipe. `onChange` is the state setter for the open index (null closes it).
export default function HotelLightbox({ images, index, onChange }) {
  const total = images?.length || 1;
  const swipe = useSwipe((dir) => onChange((i) => (i === null ? i : (i - dir + total) % total)));

  const next = (e) => { e.stopPropagation(); onChange((prev) => (prev + 1) % images.length); };
  const prev = (e) => { e.stopPropagation(); onChange((p) => (p === 0 ? images.length - 1 : p - 1)); };

  return (
    <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => onChange(null)} {...swipe}>
      <button
        onClick={() => onChange(null)}
        className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>

      {images.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-4 md:left-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all"
          aria-label="Previous"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      <img
        src={images[index]}
        alt="Expanded view"
        className="max-h-[90vh] max-w-[90vw] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          onClick={next}
          className="absolute right-4 md:right-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all"
          aria-label="Next"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}

      <div className="absolute bottom-8 left-0 w-full text-center text-white/70 font-semibold tracking-wide text-base">
        {index + 1} / {images.length}
      </div>
    </div>
  );
}

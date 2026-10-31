import { useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { WhatsAppPill } from '../../ui';
import ShareButton from '../../ShareButton';

// Full-width scrolling photo strip with back, share and "view all" controls.
export default function HotelGallery({ hotel, onBack, onOpen }) {
  const galleryRef = useRef(null);

  const scrollGallery = (direction) => {
    if (galleryRef.current) {
      const scrollAmount = window.innerWidth * 0.6;
      galleryRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-white overflow-hidden relative group pt-4">
      <button onClick={onBack} className="absolute top-6 left-6 z-30 bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary transition shadow-md" aria-label="Go back">
        <ArrowLeft className="w-6 h-6" />
      </button>
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2"><WhatsAppPill /><ShareButton dark className="backdrop-blur-md" /></div>

      <button onClick={() => scrollGallery('left')} className="absolute top-1/2 left-4 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary transition opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-xl" aria-label="Previous">
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button onClick={() => scrollGallery('right')} className="absolute top-1/2 right-4 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary transition opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-xl" aria-label="Next">
        <ChevronRight className="w-8 h-8" />
      </button>

      {hotel.images?.length > 0 && (
        <button onClick={() => onOpen(0)} className="absolute bottom-6 right-6 z-20 bg-white text-brand-dark font-semibold text-base px-5 py-3 rounded-xl shadow-elevated hover:bg-gray-50">
          View all {hotel.images.length} photo{hotel.images.length !== 1 ? 's' : ''}
        </button>
      )}
      <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-[40vh] md:h-[60vh] scroll-smooth">
        {hotel.images?.map((img, index) => (
          <div
            key={index}
            onClick={() => onOpen(index)}
            className="min-w-[85vw] md:min-w-[60vw] lg:min-w-[45vw] h-full snap-center relative p-1 cursor-pointer"
          >
            <img src={img} alt={`${hotel.title} - view ${index + 1}`} className="w-full h-full object-cover rounded-3xl hover:opacity-95 transition-opacity" />
          </div>
        ))}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

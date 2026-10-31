import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const scrollGallery = (ref, direction) => {
  if (ref.current) {
    const scrollAmount = direction === 'left' ? -ref.current.offsetWidth : ref.current.offsetWidth;
    ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
};

function MobileGallery({ images, onOpen }) {
  const scrollRef = useRef(null);
  return (
    <div className="md:hidden relative h-[300px] rounded-3xl overflow-hidden group">
      <div ref={scrollRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {images.map((img, idx) => (
          <div key={idx} onClick={() => onOpen(idx)} className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer">
            <img src={img} className="absolute inset-0 w-full h-full object-cover" alt={`View ${idx + 1}`} />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button onClick={() => scrollGallery(scrollRef, 'left')} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-md z-10" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => scrollGallery(scrollRef, 'right')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-md z-10" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
        </>
      )}
    </div>
  );
}

function Tile({ src, alt, onClick, className = '', imgClass }) {
  return (
    <div className={`w-full h-full relative cursor-pointer ${className}`} onClick={onClick}>
      <img src={src} className={imgClass} alt={alt} />
    </div>
  );
}

const FILL = 'absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity';

function DesktopGallery({ images, onOpen }) {
  const scrollRef = useRef(null);
  return (
    <div className="hidden md:block h-[540px] rounded-3xl overflow-hidden">
      {images.length === 1 && (
        <Tile src={images[0]} alt="Main View" onClick={() => onOpen(0)} imgClass="absolute inset-0 w-full h-full object-cover rounded-2xl" />
      )}
      {images.length === 2 && (
        <div className="grid grid-cols-2 gap-2 h-full">
          <Tile src={images[0]} alt="View 1" onClick={() => onOpen(0)} imgClass={FILL} />
          <Tile src={images[1]} alt="View 2" onClick={() => onOpen(1)} imgClass={FILL} />
        </div>
      )}
      {images.length >= 3 && (
        <div className="grid grid-cols-2 gap-2 h-full">
          <Tile src={images[0]} alt="Main View" onClick={() => onOpen(0)} className="group" imgClass={FILL} />
          <div className="grid grid-rows-2 gap-2 h-full">
            <Tile src={images[1]} alt="View 2" onClick={() => onOpen(1)} className="group" imgClass={FILL} />
            <div className="w-full h-full relative group">
              <div ref={scrollRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                {images.slice(2).map((img, idx) => (
                  <div key={idx} onClick={() => onOpen(idx + 2)} className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer">
                    <img src={img} className={FILL} alt={`View ${idx + 3}`} />
                  </div>
                ))}
              </div>
              {images.length > 3 && (
                <>
                  <button onClick={() => scrollGallery(scrollRef, 'left')} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-brand-dark p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => scrollGallery(scrollRef, 'right')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-brand-dark p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CarGallery({ images, onOpen }) {
  return (
    <div className="relative mb-12">
      <MobileGallery images={images} onOpen={onOpen} />
      <DesktopGallery images={images} onOpen={onOpen} />
    </div>
  );
}

import { X } from 'lucide-react';

// Full-screen look at one photo or video from a listing.
export default function MediaViewer({ media, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in zoom-in duration-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
        {media.type === 'image' ? (
          <img src={media.url} alt="Enlarged inspection" className="max-w-full max-h-full object-contain rounded-lg shadow-elevated" />
        ) : (
          <video src={media.url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-elevated" />
        )}
      </div>
    </div>
  );
}

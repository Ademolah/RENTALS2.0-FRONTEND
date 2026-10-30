import { useEffect, useMemo, useRef } from 'react';
import { ImagePlus, XCircle } from 'lucide-react';

const MAX_PHOTOS = 5;

// Private arrival notes and photos. The server shows them only to guests with a paid booking.
export default function ArrivalGuideFields({ notes, onNotes, photos, onPhotos, label = 'Arrival guide', hint }) {
  const inputRef = useRef(null);
  const urls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);

  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const add = (e) => {
    const picked = Array.from(e.target.files || []);
    onPhotos([...photos, ...picked].slice(0, MAX_PHOTOS));
    e.target.value = '';
  };

  return (
    <section>
      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{label} <span className="text-sm font-medium text-gray-400">(optional)</span></h3>
      <p className="text-base text-gray-500 mt-1 mb-5">
        {hint || 'Only guests with a paid booking see this: entry instructions, parking, gate codes, anything that helps them arrive smoothly.'}
      </p>
      <textarea
        rows={4}
        maxLength={1000}
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        placeholder="e.g. Blue gate opposite the supermarket. Ring flat 3. Parking is on the left."
        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base bg-gray-50/30 focus:bg-white resize-none"
      />
      <div className="text-right text-sm text-gray-400 mt-1">{notes.length} / 1000</div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {urls.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
            <img src={url} alt={`Arrival ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => onPhotos(photos.filter((_, idx) => idx !== i))}
              className="absolute top-1.5 right-1.5 text-white bg-black/50 hover:bg-red-500 rounded-full"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-900 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-sm font-semibold">Add photo</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={add} />
      <p className="text-sm text-gray-400 mt-2">Up to {MAX_PHOTOS} photos.</p>
    </section>
  );
}

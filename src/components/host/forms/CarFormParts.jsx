import { X, Video, Image as ImageIcon } from 'lucide-react';

const BLOCK_LABEL = 'block text-xs font-bold text-gray-700 tracking-wide mb-1 uppercase';
const DROP_INNER = 'border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-gray-100 group-hover:border-gray-400 transition-colors';

// Select with a chevron (year and seat capacity).
export function ChevronSelect({ label, children, ...select }) {
  return (
    <div>
      <label className={BLOCK_LABEL}>{label}</label>
      <div className="relative group">
        <select
          required
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all text-gray-900 font-medium appearance-none cursor-pointer group-hover:border-gray-300"
          {...select}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
}

// Photos and the optional tour video of the car create form.
export function CarMedia({ photos, video, onPickVideo, onPickPhotos, maxPhotos }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-100 pb-2">
        <h3 className="text-sm font-bold text-gray-900">Vehicle Imagery</h3>
        <div className="flex space-x-2">
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {photos.files.length} / 10 PHOTOS
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${video.file ? 'bg-brand-primary/10 text-brand-dark' : 'bg-gray-100 text-gray-400'}`}>
            {video.file ? '1 / 1 VIDEO' : 'OPTIONAL VIDEO'}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 tracking-wide mb-2 uppercase">Cinematic Video Tour (Optional)</label>
        {!video.file ? (
          <div className="relative group">
            <input
              type="file"
              accept="video/mp4, video/quicktime"
              onChange={onPickVideo}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={DROP_INNER}>
              <Video className="w-6 h-6 text-gray-400 mb-2 group-hover:text-gray-900 transition-colors" />
              <span className="text-sm font-semibold text-gray-700">Upload 30-second Video</span>
              <span className="text-xs text-gray-500 mt-1 text-center max-w-xs">MP4 or MOV up to 50MB.</span>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black flex justify-center h-48 shadow-inner group">
            <video src={video.url} controls className="h-full object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); video.remove(); }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-gray-900 shadow-sm uppercase tracking-wider">
              Cinematic Tour
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 tracking-wide mb-2 uppercase">High-Resolution Photos</label>
        {photos.files.length < maxPhotos && (
          <div className="relative group">
            <input
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={onPickPhotos}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={DROP_INNER}>
              <ImageIcon className="w-6 h-6 text-gray-400 mb-2 group-hover:text-gray-900 transition-colors" />
              <span className="text-sm font-semibold text-gray-700">Upload Photos</span>
              <span className="text-xs text-gray-500 mt-1 text-center max-w-xs">JPEG or PNG. High resolution strictly required.</span>
            </div>
          </div>
        )}

        {photos.files.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {photos.files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={`relative rounded-xl overflow-hidden border border-gray-200 group bg-gray-100 ${index === 0 ? 'col-span-4 aspect-video' : 'col-span-1 aspect-square'}`}
              >
                <img src={photos.urls[index]} alt={`preview-${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {index === 0 && (
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-gray-900 shadow-sm">
                    Cover Image
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); photos.remove(index); }}
                  className="absolute top-3 right-3 p-1.5 bg-white/95 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 12-hour rate slider with the 5% commission line (host-side wording only).
export function CarPriceCard({ value, onChange }) {
  return (
    <div className="space-y-4 pb-4">
      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Pricing Structure</h3>
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <label className="text-xs font-semibold text-gray-700">Base 12-Hour Rate</label>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900">₦{Number(value).toLocaleString()}</span>
          </div>
        </div>
        <input
          type="range"
          min="20000"
          max="1500000"
          step="5000"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
        />
        <div className="flex justify-between items-center text-xs pt-4 mt-4 border-t border-gray-200">
          <span className="text-gray-500">Platform commission (5%)</span>
          <span className="font-semibold text-gray-900">Estimated Net: ₦{Math.round(value * 0.95).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

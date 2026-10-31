import { UploadCloud, XCircle, Video, Trash2, Image as ImageIcon } from 'lucide-react';

// --- Studio style (property and VIP create forms) ---
const dropClass = (padding) => `border-2 border-dashed border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-2xl ${padding} flex flex-col items-center justify-center cursor-pointer group`;

export function StudioVideoField({ video, inputRef, onSelect }) {
  if (video.file) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black flex justify-center h-48 md:h-64 shadow-inner">
        <video src={video.url} controls className="h-full object-contain" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); video.remove(); }}
          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-gray-900 shadow-sm uppercase tracking-wider">
          Cinematic Tour
        </div>
      </div>
    );
  }
  return (
    <div onClick={() => inputRef.current?.click()} className={dropClass('p-8')}>
      <input type="file" accept="video/mp4, video/quicktime" className="hidden" ref={inputRef} onChange={(e) => onSelect(e.target.files[0])} />
      <div className="p-3 bg-gray-100 group-hover:bg-white rounded-full mb-3 transition-colors shadow-sm">
        <Video className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
      </div>
      <span className="text-sm font-semibold text-gray-900">Upload 30-second Video</span>
      <span className="text-xs text-gray-500 mt-1">MP4, MOV up to 50MB</span>
    </div>
  );
}

export function StudioPhotoDrop({ inputRef, onSelect, padding = 'p-8', hint }) {
  return (
    <div onClick={() => inputRef.current?.click()} className={dropClass(padding)}>
      <input type="file" multiple accept="image/jpeg, image/png, image/webp" className="hidden" ref={inputRef} onChange={(e) => onSelect(e)} />
      <div className="p-4 bg-gray-100 group-hover:bg-white rounded-full mb-4 transition-colors shadow-sm">
        <UploadCloud className="w-8 h-8 text-gray-600 group-hover:text-gray-900" />
      </div>
      <span className="text-base font-semibold text-gray-900">Click to browse or drag photos here</span>
      {hint && <span className="text-sm text-gray-500 mt-1">{hint}</span>}
    </div>
  );
}

export function StudioPreviewGrid({ urls, onRemove, showCover }) {
  if (urls.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
      {urls.map((url, index) => (
        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 shadow-sm">
          <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              className="p-2 bg-white/20 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          {showCover && index === 0 && (
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-gray-900 shadow-sm">
              COVER
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// The "Rentals Quality Standard" notice above the media section.
export function QualityNotice({ children }) {
  return (
    <div className="mb-6 p-5 rounded-2xl bg-gray-900 text-white shadow-md border border-gray-800">
      <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs tracking-widest uppercase mb-2">
        <span>Rentals Quality Standard</span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed font-medium">{children}</p>
    </div>
  );
}

// --- Edit style (shortlet, car and hotel editors): kept photos, new photos and an upload tile ---
const EDIT_GRID = {
  standard: {
    grid: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-4',
    remove: 'absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110',
    upload: 'aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer group transition-colors',
    icon: 'w-6 h-6 text-gray-400 group-hover:text-brand-primary mb-2',
    text: 'Add Photos',
  },
  compact: {
    grid: 'grid grid-cols-3 md:grid-cols-5 gap-4',
    remove: 'absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all',
    upload: 'aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors',
    icon: 'w-6 h-6 text-gray-400 mb-1',
    text: 'Upload',
  },
};

export function EditImageGrid({ variant = 'standard', existing, newUrls, onRemoveExisting, onRemoveNew, onAdd }) {
  const s = EDIT_GRID[variant];
  return (
    <div className={s.grid}>
      {existing.map((img, idx) => (
        <div key={`old-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
          <img src={img} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
          <button type="button" onClick={() => onRemoveExisting(idx)} className={s.remove} aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {newUrls.map((url, idx) => (
        <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-brand-primary shadow-sm">
          <img src={url} alt={`New ${idx}`} className="w-full h-full object-cover opacity-80" />
          <button type="button" onClick={() => onRemoveNew(idx)} className={s.remove} aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <label className={s.upload}>
        <ImageIcon className={s.icon} />
        <span className="text-xs font-bold text-gray-500 uppercase">{s.text}</span>
        <input type="file" multiple accept="image/*" className="hidden" onChange={onAdd} />
      </label>
    </div>
  );
}

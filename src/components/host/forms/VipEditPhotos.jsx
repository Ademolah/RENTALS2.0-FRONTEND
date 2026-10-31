import { UploadCloud, XCircle } from 'lucide-react';

// Photo section of the VIP editor: kept photos, newly picked photos and an upload area.
export default function VipEditPhotos({ existing, newUrls, max, inputRef, onRemoveExisting, onRemoveNew, onPick }) {
  const overlay = 'absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white';
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Photos</h3>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {existing.length + newUrls.length}{` / ${max}`}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {existing.map((url, idx) => (
          <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
            <img src={url} className="w-full h-full object-cover" alt="Property" />
            <button type="button" onClick={() => onRemoveExisting(idx)} className={overlay}><XCircle className="w-8 h-8" /></button>
          </div>
        ))}
        {newUrls.map((url, idx) => (
          <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-brand-primary group">
            <img src={url} className="w-full h-full object-cover" alt="Preview" />
            <div className="absolute top-2 left-2 bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded">NEW</div>
            <button type="button" onClick={() => onRemoveNew(idx)} className={overlay}><XCircle className="w-8 h-8" /></button>
          </div>
        ))}
      </div>
      <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
        <input type="file" multiple accept="image/*" className="hidden" ref={inputRef} onChange={onPick} />
        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm font-semibold">Upload More Photos</span>
      </div>
    </section>
  );
}

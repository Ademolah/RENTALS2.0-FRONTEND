import { PlayCircle } from 'lucide-react';
import { ReviewModalShell, ReviewFooter } from './ReviewModalParts';

export default function ListingReviewModal({ listing, busy, onClose, onDecision, onOpenMedia }) {
  const isCar = !!listing.make;
  const assetType = isCar ? 'CAR' : 'PROPERTY';
  const subtitle = `${isCar ? `${listing.make} ${listing.model}` : listing.title} • ${isCar ? 'CAR' : listing.category}`;

  return (
    <ReviewModalShell
      title="Review Listing Quality"
      subtitle={subtitle}
      widthClass="max-w-4xl"
      bodyClass="space-y-6"
      onClose={onClose}
      footer={(
        <ReviewFooter
          busy={busy}
          onReject={() => onDecision(assetType, listing._id, 'REJECTED')}
          onApprove={() => onDecision(assetType, listing._id, 'APPROVED')}
          rejectLabel="Reject Quality"
          approveLabel="Approve to Live Feed"
        />
      )}
    >
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted mb-2">Description</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{listing.description}</p>
        <div className="mt-4 flex space-x-4">
          <span className="text-xs font-bold text-brand-dark bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            Price: ₦{listing.pricePerNight || listing.pricePer12Hours || 0}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted mb-3">Media Inspection (Click to enlarge)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listing.video && (
            <div
              onClick={() => onOpenMedia({ url: listing.video, type: 'video' })}
              className="relative aspect-square bg-brand-dark rounded-xl overflow-hidden cursor-pointer group flex items-center justify-center border border-gray-200 shadow-sm"
            >
              <video src={listing.video} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
              <PlayCircle className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform" />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white font-bold">VIDEO</div>
            </div>
          )}

          {listing.images?.map((img, idx) => (
            <div
              key={`${idx}-${img}`}
              onClick={() => onOpenMedia({ url: img, type: 'image' })}
              className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer group border border-gray-200 shadow-sm relative"
            >
              <img src={img} alt={`Listing ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>
    </ReviewModalShell>
  );
}

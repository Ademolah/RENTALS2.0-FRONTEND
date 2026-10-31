import { useState } from 'react';
import DeleteAssetModal from '../../DeleteAssetModal';

// Delete section and confirmation, identical in every editor.
export default function DangerZone({ assetId, assetType, assetName, onClose, onSuccess }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mt-8 pt-8 border-t border-red-100">
        <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
          <div>
            <h4 className="text-sm font-bold text-red-900">Danger Zone</h4>
            <p className="text-xs font-medium text-red-700/80">Permanently remove this listing from Rentals Africa.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            Delete Listing
          </button>
        </div>
      </div>
      <DeleteAssetModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); onClose(); onSuccess(); }}
        assetId={assetId}
        assetType={assetType}
        assetName={assetName}
      />
    </>
  );
}


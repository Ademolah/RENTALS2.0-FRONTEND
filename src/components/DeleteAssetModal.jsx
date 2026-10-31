import React, { useState } from 'react';
import { AlertCircle, Loader2, X, Trash2 } from 'lucide-react';
import { deleteProperty } from '../api/properties';
import { deleteVipEstablishment } from '../api/vip';
import { deleteCar } from '../api/car';
import { deleteHotel } from '../api/hotel';

export default function DeleteAssetModal({ isOpen, onClose, onSuccess, assetId, assetType, assetName }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    
    try {
      if (assetType === 'SHORTLET') {
        await deleteProperty(assetId);
      } else if (assetType === 'VIP') {
        await deleteVipEstablishment(assetId);
      } else if (assetType === 'CAR') {
        await deleteCar(assetId);
      } else if (assetType === 'HOTEL') {
        await deleteHotel(assetId);
      }
      onSuccess();
      onClose();
    } catch (err) {
      // Specifically catch the 400 Bad Request escrow protection error
      setError(err.response?.data?.message || 'Failed to delete listing. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors z-10"
         aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Delete Listing?
          </h3>
          
          <p className="text-sm font-medium text-gray-500 mb-6">
            Are you sure you want to permanently delete <span className="font-bold text-gray-900">{assetName || 'this asset'}</span>? This action cannot be undone.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-start animate-in fade-in">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 py-4 font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting} 
              className="flex-1 py-4 font-bold text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
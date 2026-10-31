import { useState } from 'react';
import {
  approveHostApplication, rejectHostApplication, toggleAssetStatus, updateAssetApprovalStatus,
} from '../../api/admin';
import { errMsg } from './statusStyles';

const PROPERTY_TYPES = ['PROPERTY', 'SHORTLET', 'HOTEL', 'VIP RESERVATION'];

// Review dialogs and the buttons inside them: approve or reject a host, approve or reject a listing, toggle badges.
export function useAdminActions({ notify, setApplications, setAssets }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [mediaViewer, setMediaViewer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const decideApplication = async (id, request, failureMessage) => {
    setActionLoading(true);
    try {
      await request();
      setApplications((apps) => apps.filter((app) => app._id !== id));
      setSelectedApp(null);
    } catch (error) {
      notify(errMsg(error, failureMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (id) =>
    decideApplication(id, () => approveHostApplication(id), 'Approval failed. Please try again.');

  const handleReject = (id) =>
    decideApplication(id, () => rejectHostApplication(id, 'Failed internal verification'), 'Rejection failed. Please try again.');

  const handleToggleAsset = async (type, id, field, currentValue) => {
    try {
      const payload = { [field]: !currentValue };
      await toggleAssetStatus(type, id, payload);
      const key = PROPERTY_TYPES.includes(type) ? 'properties' : 'cars';
      setAssets((prev) => ({
        ...prev,
        [key]: prev[key].map((item) => (item._id === id ? { ...item, ...payload } : item)),
      }));
    } catch (error) {
      notify(errMsg(error, 'Could not update the asset.'));
    }
  };

  const handleListingApproval = async (type, id, status) => {
    setActionLoading(true);
    try {
      await updateAssetApprovalStatus(type, id, status);
      setAssets((prev) => ({
        ...prev,
        properties: prev.properties.map((p) => (p._id === id ? { ...p, status } : p)),
        cars: prev.cars.map((c) => (c._id === id ? { ...c, status } : c)),
      }));
      setSelectedListing(null);
    } catch (error) {
      notify(errMsg(error, 'Could not update the listing status.'));
    } finally {
      setActionLoading(false);
    }
  };

  return {
    selectedApp, setSelectedApp,
    selectedListing, setSelectedListing,
    mediaViewer, setMediaViewer,
    actionLoading,
    handleApprove, handleReject, handleToggleAsset, handleListingApproval,
  };
}

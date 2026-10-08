import { apiClient } from './client';

// ==========================================
// 1. PLATFORM OVERVIEW (STATS)
// ==========================================
export const getDashboardStats = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

// ==========================================
// 2. ESCROW & PAYOUT LEDGER
// ==========================================
export const getEscrowLedger = async () => {
  const response = await apiClient.get('/admin/ledger');
  return response.data;
};

// ==========================================
// 3. ASSET OVERSIGHT
// ==========================================
export const getAssetOversight = async () => {
  const response = await apiClient.get('/admin/assets');
  return response.data;
};

// ==========================================
// 4. VERIFY / SUSPEND ASSETS
// ==========================================
export const toggleAssetStatus = async (assetType, assetId, data) => {
  // data expects: { isVerified: boolean, isAvailable: boolean }
  const response = await apiClient.patch(`/admin/assets/${assetType}/${assetId}`, data);
  return response.data;
};

// ==========================================
// 5. HOST APPLICATIONS COMMANDS
// ==========================================
export const getHostApplications = async () => {
  const response = await apiClient.get('/admin/host-applications');
  return response.data;
};

export const approveHostApplication = async (id) => {
  const response = await apiClient.patch(`/admin/host-applications/${id}`, { 
    status: 'APPROVED' 
  });
  return response.data;
};

export const rejectHostApplication = async (id, reason) => {
  const response = await apiClient.patch(`/admin/host-applications/${id}`, { 
    status: 'REJECTED', 
    reason 
  });
  return response.data;
};
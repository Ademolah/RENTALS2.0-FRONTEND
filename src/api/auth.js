import { apiClient } from './client';

export const forgotPasswordApi = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

// 💡 SURGICAL FIX: Update the parameters to accept email, token, and newPassword
export const resetPasswordApi = async (email, token, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { 
    email, 
    token, 
    newPassword 
  });
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};


export const verifyEmailApi = async (email, otpCode) => {
  const response = await apiClient.post('/auth/verify-email', { email, otpCode });
  return response.data;
};
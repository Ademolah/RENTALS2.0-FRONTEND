import { apiClient } from './client';

export const forgotPasswordApi = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordApi = async (token, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { token, newPassword });
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
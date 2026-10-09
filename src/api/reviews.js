import axios from 'axios';

// Replace with your configured axios instance if you have one (e.g., import api from './api')
const API_URL = import.meta.env.VITE_API_URL 

export const getPropertyReviewsApi = async (propertyId) => {
  const response = await axios.get(`${API_URL}/reviews/${propertyId}`);
  return response.data;
};

export const createPropertyReviewApi = async (propertyId, reviewData, token) => {
  const response = await axios.post(
    `${API_URL}/reviews/${propertyId}`,
    reviewData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};
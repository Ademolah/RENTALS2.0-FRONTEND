import axios from 'axios';
import { API_URL } from '../lib/config';

// Fallback to localhost if environment variable is missing
const baseURL = API_URL;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercept requests to inject the authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rentals_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Check if the error is coming from the login API itself
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401) {
      // 2. Only clear the session if the 401 is an expiry, NOT a bad login attempt
      if (!isLoginEndpoint) {
        localStorage.removeItem('rentals_token');
        localStorage.removeItem('rentals_user');
        window.location.href = '/?session=expired';
      }
    }
    return Promise.reject(error);
  }
);
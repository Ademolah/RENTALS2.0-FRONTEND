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

// An expired session (401 on a request that carried a token) signs the user out and goes home.
// Login and Google sign-in failures are NOT session expiry, so they are left alone.
function handleSessionExpiry(error) {
  const url = error.config?.url || '';
  const h = error.config?.headers;
  const sentToken = !!(h?.Authorization || h?.authorization || h?.get?.('Authorization'));
  const isAuthEndpoint = url.includes('/auth/');
  if (error.response?.status === 401 && sentToken && !isAuthEndpoint) {
    localStorage.removeItem('rentals_token');
    localStorage.removeItem('rentals_user');
    window.location.href = '/?session=expired';
  }
  return Promise.reject(error);
}

// Intercept responses to handle global errors
apiClient.interceptors.response.use((response) => response, handleSessionExpiry);

// Calls made with plain axios (a few uploads and payout screens) get the same expiry handling.
axios.interceptors.response.use((response) => response, handleSessionExpiry);

import axios from 'axios';

// Fallback to localhost if environment variable is missing
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

// Optional: Intercept responses to handle global errors (e.g., auto-logout on 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rentals_token');
      window.location.href = '/login'; // Force redirect to login
    }
    return Promise.reject(error);
  }
);
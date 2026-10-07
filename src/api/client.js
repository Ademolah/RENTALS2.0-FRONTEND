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

// Intercept responses to handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Check if the error is coming from the login API itself
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401) {
      localStorage.removeItem('rentals_token');
      
      // 2. Only redirect if the 401 is a session expiration, NOT a bad login attempt
      if (!isLoginEndpoint) {
        window.location.href = '/'; // Safely route to the home page instead of a non-existent /login
      }
    }
    return Promise.reject(error);
  }
);
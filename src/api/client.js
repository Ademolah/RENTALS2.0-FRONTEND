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
    // Every /auth/* endpoint (login, register, forgot-password, reset-password,
    // verify-email, google) is about establishing or recovering an identity, not
    // about an existing session. A 401 from any of them is that specific operation
    // failing (bad password, expired reset token, wrong OTP, ...) — never a sign
    // that a logged-in session expired. Treating it as one wiped the stored token
    // and hard-redirected to "/" before the calling form could show its own error,
    // which is exactly what broke the reset-password screen for an expired/reused link.
    const isAuthEndpoint = error.config?.url?.includes('/auth/');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('rentals_token');
      window.location.href = '/'; // Safely route to the home page instead of a non-existent /login
    }
    return Promise.reject(error);
  }
);
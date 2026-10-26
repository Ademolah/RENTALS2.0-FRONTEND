import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; 
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 💡 INJECTED: Wrapped the app with the GoogleOAuthProvider */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB}>
      <HelmetProvider>
        <Router>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Router>
      </HelmetProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
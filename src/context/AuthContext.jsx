import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser as loginApi, registerUser as registerApi } from '../api/auth';

const AuthContext = createContext(null);

// The signed-in user is restored from this device before the first render.
function readStoredUser() {
  const storedToken = localStorage.getItem('rentals_token');
  const storedUser = localStorage.getItem('rentals_user');
  if (!storedToken || !storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('rentals_token');
    localStorage.removeItem('rentals_user');
    return null;
  }
}

const sessionExpiredInUrl = () => new URLSearchParams(window.location.search).get('session') === 'expired';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const loading = false;
  
  // NEW: Global state for the Auth Modal (opens straight away after a session expiry redirect)
  const [showAuthModal, setShowAuthModalState] = useState(sessionExpiredInUrl);
  const pendingRef = useRef(null);

  // Closing the modal without signing in drops the action that was waiting.
  const setShowAuthModal = useCallback((open) => {
    if (!open) pendingRef.current = null;
    setShowAuthModalState(open);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    if (sessionExpiredInUrl()) window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem('rentals_user', JSON.stringify(next));
      return next;
    });
  };

  // Helper function to cleanly extract token and user from various response structures
  const extractAuthData = (apiResponse) => {
    const token = apiResponse?.token;
    const user = apiResponse?.user || apiResponse?.data?.user;
    return { token, user };
  };

 

  // Runs `action` now if signed in; otherwise opens sign-in and runs it after success.
  const requireAuth = (action) => {
    if (localStorage.getItem('rentals_token')) {
      action?.();
      return true;
    }
    pendingRef.current = action || null;
    setShowAuthModalState(true);
    return false;
  };

  // Stores the session without navigating, so callers can add steps before finishing.
  const completeSignIn = (token, userPayload) => {
    localStorage.setItem('rentals_token', token);
    localStorage.setItem('rentals_user', JSON.stringify(userPayload));
    setUser(userPayload);
  };

  // Closes the modal, then resumes the waiting action or goes to the role dashboard.
  const finishSignIn = (userPayload) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setShowAuthModalState(false);
    if (pending) setTimeout(pending, 0);
    else redirectUserByRole(userPayload?.role);
  };

  const login = async (credentials) => {
    // Return the promise directly so AuthModal's try/catch can handle failures
    const rawResponse = await loginApi(credentials);
    const { token, user: userPayload } = extractAuthData(rawResponse);
    
    if (!token || !userPayload) {
      throw new Error("Unable to parse user session from server response.");
    }

    completeSignIn(token, userPayload);
    finishSignIn(userPayload);
    return rawResponse;
  };

  const register = async (userData) => {
    const rawResponse = await registerApi(userData);
    const { token, user: userPayload } = extractAuthData(rawResponse);

    if (!token || !userPayload) {
      throw new Error("Unable to parse user session from server response.");
    }

    completeSignIn(token, userPayload);
    finishSignIn(userPayload);
    return rawResponse;
  };
  
  const logout = () => {
    localStorage.removeItem('rentals_token');
    localStorage.removeItem('rentals_user');
    setUser(null);
    pendingRef.current = null;
    navigate('/');
  };

  const redirectUserByRole = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        navigate('/dashboard/admin');
        break;
      case 'LANDLORD':
        navigate('/dashboard/landlord');
        break;
      case 'USER':
      case 'GUEST':
      default:
        navigate('/dashboard/guest');
        break;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateUser,
      requireAuth,
      completeSignIn,
      finishSignIn,
      redirectUserByRole,
      showAuthModal,      // EXPOSED TO APP
      setShowAuthModal    // EXPOSED TO APP
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- useAuth is imported from every page, so it stays beside the provider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser as loginApi, registerUser as registerApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // NEW: Global state for the Auth Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('rentals_token');
    const storedUser = localStorage.getItem('rentals_user');
    
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('rentals_token');
        localStorage.removeItem('rentals_user');
      }
    }
    setLoading(false);
  }, []);

  // Helper function to cleanly extract token and user from various response structures
  const extractAuthData = (apiResponse) => {
    const token = apiResponse?.token;
    const user = apiResponse?.user || apiResponse?.data?.user;
    return { token, user };
  };

 

  const login = async (credentials) => {
    // Return the promise directly so AuthModal's try/catch can handle failures
    const rawResponse = await loginApi(credentials);
    const { token, user: userPayload } = extractAuthData(rawResponse);
    
    if (!token || !userPayload) {
      throw new Error("Unable to parse user session from server response.");
    }

    localStorage.setItem('rentals_token', token);
    localStorage.setItem('rentals_user', JSON.stringify(userPayload));
    setUser(userPayload);
    
    setShowAuthModal(false);
    redirectUserByRole(userPayload.role);
    return rawResponse;
  };

  const register = async (userData) => {
    const rawResponse = await registerApi(userData);
    const { token, user: userPayload } = extractAuthData(rawResponse);

    if (!token || !userPayload) {
      throw new Error("Unable to parse user session from server response.");
    }

    localStorage.setItem('rentals_token', token);
    localStorage.setItem('rentals_user', JSON.stringify(userPayload));
    setUser(userPayload);

    setShowAuthModal(false);
    redirectUserByRole(userPayload.role);
    return rawResponse;
  };
  
  const logout = () => {
    localStorage.removeItem('rentals_token');
    localStorage.removeItem('rentals_user');
    setUser(null);
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
      redirectUserByRole,
      showAuthModal,      // EXPOSED TO APP
      setShowAuthModal    // EXPOSED TO APP
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
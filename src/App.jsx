import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './index.css';
import WelcomeOverlay from './components/WelcomeOverlay';
import CitySelectorModal from "./components/CitySelectorModal";
import Navbar from './components/Navbar';
import AdvancedSearch from './components/AdvancedSearch';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import HotelDetails from './pages/HotelDetails';
import HotelDetail from './pages/HotelDetail';
import Footer from './components/Footer';
import LandlordDashboard from './pages/LandlordDashboard';
import GuestDashboard from './pages/GuestDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CarDetails from './pages/CarDetails';
import CarsList from './pages/CarsList';
import VipDetails from './pages/VipDetails';
import VipSuccess from './pages/VipSuccess';
import ListYourProperty from './pages/ListYourProperty';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Sitemap from './pages/Sitemap';
import ResetPassword from './pages/ResetPassword';
import VipServiceDetails from './components/VipServiceDetails';
import BookingDetail from './pages/BookingDetail';
import BookingPass from './pages/BookingPass';
import MyReviews from './pages/MyReviews';
import SavedListings from './pages/SavedListings';
import Stays from './pages/Stays';
import PaymentCallback from './pages/PaymentCallback';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  const role = user.role?.toUpperCase();
  if (role === 'ADMIN') return <Navigate to="/dashboard/admin" replace />;
  if (role === 'LANDLORD') return <Navigate to="/dashboard/landlord" replace />;
  return <Navigate to="/dashboard/guest" replace />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

let hasSeenCityModalThisSession = false;

function App() {
  const [activeCategory, setActiveCategory] = useState('shortlet');
  const [searchFilters, setSearchFilters] = useState({});
  const [selectedCity, setSelectedCity] = useState('Lagos');
  const [showCityModal, setShowCityModal] = useState(!hasSeenCityModalThisSession);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  const DETAIL_PREFIXES = ['/property/', '/cars/', '/hotels/', '/hotel/', '/vip/', '/bookings/', '/payment', '/reset-password', '/list-property', '/about', '/terms', '/privacy', '/sitemap', '/vip-success', '/dashboard', '/my-reviews', '/stays', '/cars'];
  const showSearch = isHomePage || !DETAIL_PREFIXES.some(p => location.pathname.startsWith(p));

  useEffect(() => { setSearchFilters({}); }, [activeCategory]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    if (location.pathname !== '/') navigate('/');
  };

  const handleCitySelect = (selectedState) => {
    hasSeenCityModalThisSession = true;
    setSelectedCity(selectedState);
    setSearchFilters({ ...searchFilters, location: selectedState });
    setShowCityModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <ScrollToTop />
      <WelcomeOverlay />

      {showCityModal && activeCategory === 'shortlet' && isHomePage && (
        <CitySelectorModal onSelect={handleCitySelect} />
      )}

      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm flex flex-col">
        <div className="relative z-40 has-[.mobile-menu-open]:z-[70] md:z-[99]">
          <Navbar
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {showSearch && (
          <div className="relative z-[60] md:z-30 pb-4 bg-white">
            <AdvancedSearch
              activeCategory={activeCategory}
              activeCityContext={selectedCity}
              onSearch={setSearchFilters}
            />
          </div>
        )}
      </div>

      <div className="flex-grow pb-20 md:pb-0">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home activeCategory={activeCategory} searchFilters={searchFilters} activeCityContext={selectedCity} />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            <Route path="/cars" element={<CarsList />} />
            <Route path="/hotels/:id" element={<HotelDetail />} />
            <Route path="/hotel/:id" element={<HotelDetails />} />
            <Route path="/vip/:id" element={<VipDetails />} />
            <Route path="/vip/services/:id" element={<VipServiceDetails />} />
            <Route path="/vip-success" element={<VipSuccess />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/bookings/:id/pass" element={<ProtectedRoute><BookingPass /></ProtectedRoute>} />
            <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
            <Route path="/saved" element={<SavedListings />} />
            <Route path="/stays" element={<Stays />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/dashboard/guest" element={<ProtectedRoute><GuestDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/landlord" element={<ProtectedRoute><LandlordDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/list-property" element={<ListYourProperty />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </div>

      {!location.pathname.startsWith('/dashboard') && <Footer />}
    </div>
  );
}

export default App;
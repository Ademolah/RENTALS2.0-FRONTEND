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
import BookingSuccess from './pages/BookingSuccess';
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

// The city onboarding modal only shows on a visitor's first few visits
const MAX_CITY_MODAL_VISITS = 5;
const CITY_KEY = 'rentals_city';
const VISIT_COUNT_KEY = 'rentals_visit_count';
const VISIT_COUNTED_KEY = 'rentals_visit_counted';
const CITY_MODAL_SEEN_KEY = 'rentals_city_modal_seen';

// A visit is one browser session, so refreshes and page changes don't add to the count
const getVisitCount = () => {
  let count = Number(localStorage.getItem(VISIT_COUNT_KEY)) || 0;
  if (!sessionStorage.getItem(VISIT_COUNTED_KEY)) {
    count += 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
    sessionStorage.setItem(VISIT_COUNTED_KEY, 'true');
  }
  return count;
};

const visitCount = getVisitCount();

function App() {
  const [activeCategory, setActiveCategory] = useState('shortlet');
  const [searchFilters, setSearchFilters] = useState({});
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem(CITY_KEY) || 'Lagos');
  const [showCityModal, setShowCityModal] = useState(() => visitCount <= MAX_CITY_MODAL_VISITS && !sessionStorage.getItem(CITY_MODAL_SEEN_KEY));
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  const DETAIL_PREFIXES = ['/property/', '/cars/', '/hotels/', '/hotel/', '/vip/', '/bookings/', '/payment', '/reset-password', '/list-property', '/about', '/terms', '/privacy', '/sitemap', '/vip-success', '/dashboard', '/my-reviews', '/stays', '/cars'];
  const showSearch = isHomePage || !DETAIL_PREFIXES.some(p => location.pathname.startsWith(p));

  useEffect(() => { setSearchFilters({}); }, [activeCategory]);

  // Paystack always appends ?reference=&trxref= to wherever its callback_url points. If
  // that lands anywhere other than our payment-callback routes (e.g. the backend is still
  // falling back to a static root-domain Callback URL instead of the per-booking one we
  // send), send the browser to the real handler so the payment gets verified and the guest
  // is routed back to the exact page they were booking from, instead of seeing onboarding.
  const paystackParams = new URLSearchParams(location.search);
  const hasPaystackRef = paystackParams.has('reference') || paystackParams.has('trxref');
  const isPaymentRoute = ['/payment/callback', '/vip-success', '/booking-success'].includes(location.pathname);
  if (hasPaystackRef && !isPaymentRoute) {
    return <Navigate to={`/booking-success${location.search}`} replace />;
  }

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    if (location.pathname !== '/') navigate('/');
  };

  const handleCitySelect = (selectedState) => {
    sessionStorage.setItem(CITY_MODAL_SEEN_KEY, 'true');
    localStorage.setItem(CITY_KEY, selectedState);
    setSelectedCity(selectedState);
    // Drop any neighborhood searched in the previous city
    setSearchFilters({ ...searchFilters, location: '' });
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
            <Route path="/" element={<Home activeCategory={activeCategory} searchFilters={searchFilters} activeCityContext={selectedCity} onCityChange={handleCitySelect} />} />
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
            <Route path="/booking-success" element={<BookingSuccess />} />
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
import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './index.css';
import WelcomeOverlay from './components/WelcomeOverlay';
import CitySelectorModal from "./components/CitySelectorModal";
import Navbar from './components/Navbar';
import AdvancedSearch from './components/AdvancedSearch';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import HotelDetails from './pages/HotelDetails';
import Footer from './components/Footer';
const LandlordDashboard = lazy(() => import('./pages/LandlordDashboard'));
const GuestDashboard = lazy(() => import('./pages/GuestDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
import CarDetails from './pages/CarDetails';
import VipDetails from './pages/VipDetails';
import VipSuccess from './pages/VipSuccess';
import ListYourProperty from './pages/ListYourProperty';
import About from './pages/About';
import Help from './pages/Help';
import Trips from './pages/Trips';
import Saved from './pages/Saved';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Reviews from './pages/Reviews';
import Checkout from './pages/Checkout';
import ErrorBoundary from './components/ErrorBoundary';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Sitemap from './pages/Sitemap';
import ResetPassword from './pages/ResetPassword';
import VipServiceDetails from './components/VipServiceDetails';
import NotFound from './pages/NotFound';

// Keeps signed-out visitors and wrong-role users out of role dashboards.
function RequireRole({ roles, children }) {
  const { user, setShowAuthModal } = useAuth();
  const role = String(user?.role || '').toUpperCase();
  useEffect(() => {
    if (!user) setShowAuthModal(true);
  }, [user, setShowAuthModal]);
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(role)) return <Navigate to={role === 'ADMIN' ? '/dashboard/admin' : role === 'LANDLORD' ? '/dashboard/landlord' : '/dashboard/guest'} replace />;
  return children;
}

const PageLoader = () => (
  <div className="py-32 flex justify-center"><div className="w-10 h-10 border-2 border-gray-200 border-t-brand-primary rounded-full animate-spin" /></div>
);

// 1. Define the tracker completely outside the component memory
let hasSeenCityModalThisSession = false;

function App() {
  const [activeCategory, setActiveCategory] = useState('shortlet');
  const [searchFilters, setSearchFilters] = useState({});
  
  // SURGICAL FIX: Declare selectedCity state variable (defaults to 'Lagos')
  const [selectedCity, setSelectedCity] = useState('Lagos');
  
  // 2. Initialize the state using the tracker's inverse value
  const [showCityModal, setShowCityModal] = useState(!hasSeenCityModalThisSession);
  const { showAuthModal } = useAuth();
  const [welcomeDone, setWelcomeDone] = useState(() => {
    try { return !!sessionStorage.getItem('hasSeenWelcome'); } catch { return true; }
  });
  
  // Initialize useLocation to track the current route
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Switching category clears the search (adjusted during render instead of in an effect).
  const [filtersCategory, setFiltersCategory] = useState(activeCategory);
  if (filtersCategory !== activeCategory) {
    setFiltersCategory(activeCategory);
    setSearchFilters({});
  }

  const handleCitySelect = (selectedState) => {
    // 3. Update the tracker so it remembers the selection globally
    hasSeenCityModalThisSession = true;
    setSelectedCity(selectedState); // SURGICAL FIX: Save selected city to state
    setSearchFilters({ ...searchFilters, location: selectedState });
    setShowCityModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <WelcomeOverlay onDone={() => setWelcomeDone(true)} />
      
      {/* Restrict City Modal to Home Page & Shortlet Tab */}
      {showCityModal && welcomeDone && !showAuthModal && activeCategory === 'shortlet' && isHomePage && (
        <CitySelectorModal onSelect={handleCitySelect} />
      )}
      
      {/* Header Wrapper */}
      <div className="lg:sticky lg:top-0 z-50 bg-white flex flex-col">
        
        <div className="relative z-40 has-[.mobile-menu-open]:z-[70] md:z-[99]">
          <Navbar
            activeCategory={activeCategory}
            onCategoryChange={isHomePage ? setActiveCategory : undefined}
            center={isHomePage ? (
              <AdvancedSearch
                activeCategory={activeCategory}
                activeCityContext={selectedCity}
                onSearch={setSearchFilters}
              />
            ) : null}
          />
        </div>
      </div>

      <div className="flex-grow">
        <ErrorBoundary><Suspense fallback={<PageLoader />}><Routes>
          <Route 
            path="/" 
            element={
              <Home
                activeCategory={activeCategory}
                searchFilters={searchFilters}
                activeCityContext={selectedCity}
                onCategoryChange={setActiveCategory}
              />
            } 
          />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          
          <Route path="/hotel/:id" element={<HotelDetails />} />
          <Route path="/vip/:id" element={<VipDetails />} />
          <Route path="/vip-success" element={<VipSuccess />} />
          
          <Route path="/dashboard/guest" element={<GuestDashboard />} />
          <Route path="/dashboard/landlord" element={<RequireRole roles={['LANDLORD', 'ADMIN']}><LandlordDashboard /></RequireRole>} />
          <Route path="/dashboard/admin" element={<RequireRole roles={['ADMIN']}><AdminDashboard /></RequireRole>} />
          <Route path="/list-property" element={<ListYourProperty />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reviews/:id" element={<Reviews />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path='/vip/services/:id' element={<VipServiceDetails/>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes></Suspense></ErrorBoundary>
      </div>

      {/* Conditionally hide the Footer on Dashboards */}
      {!location.pathname.startsWith('/dashboard') && <Footer />}
    </div>
  );
}

export default App;
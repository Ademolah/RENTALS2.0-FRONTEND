import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './index.css';
import WelcomeOverlay from './components/WelcomeOverlay';
import CitySelectorModal from "./components/CitySelectorModal";
import Navbar from './components/Navbar';
import AdvancedSearch from './components/AdvancedSearch';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import HotelDetails from './pages/HotelDetails';
import Footer from './components/Footer';
import LandlordDashboard from './pages/LandlordDashboard';
import GuestDashboard from './pages/GuestDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CarDetails from './pages/CarDetails';
import VipDetails from './pages/VipDetails';
import VipSuccess from './pages/VipSuccess';
import ListYourProperty from './pages/ListYourProperty';
import About from './pages/About';

// 1. Define the tracker completely outside the component memory
let hasSeenCityModalThisSession = false;

function App() {
  const [activeCategory, setActiveCategory] = useState('shortlet');
  const [searchFilters, setSearchFilters] = useState({});
  
  // SURGICAL FIX: Declare selectedCity state variable (defaults to 'Lagos')
  const [selectedCity, setSelectedCity] = useState('Lagos');
  
  // 2. Initialize the state using the tracker's inverse value
  const [showCityModal, setShowCityModal] = useState(!hasSeenCityModalThisSession);
  
  // Initialize useLocation to track the current route
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setSearchFilters({});
  }, [activeCategory]);

  const handleCitySelect = (selectedState) => {
    // 3. Update the tracker so it remembers the selection globally
    hasSeenCityModalThisSession = true;
    setSelectedCity(selectedState); // SURGICAL FIX: Save selected city to state
    setSearchFilters({ ...searchFilters, location: selectedState });
    setShowCityModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <WelcomeOverlay />
      
      {/* Restrict City Modal to Home Page & Shortlet Tab */}
      {showCityModal && activeCategory === 'shortlet' && isHomePage && (
        <CitySelectorModal onSelect={handleCitySelect} />
      )}
      
      {/* Header Wrapper */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm flex flex-col">
        
        <div className="relative z-40 has-[.mobile-menu-open]:z-[70] md:z-[99]">
          <Navbar 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </div>
        
        {/* AdvancedSearch Wrapper */}
        {isHomePage && (
          <div className="relative z-[60] md:z-30 pb-4 bg-white">
            <AdvancedSearch 
              activeCategory={activeCategory}
              activeCityContext={selectedCity}
              onSearch={setSearchFilters} 
            />
          </div>
        )}
      </div>

      <div className="flex-grow">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                activeCategory={activeCategory} 
                searchFilters={searchFilters} 
                activeCityContext={selectedCity}
              />
            } 
          />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          
          <Route path="/hotel/:id" element={<HotelDetails />} />
          <Route path="/vip/:id" element={<VipDetails />} />
          <Route path="/vip-success" element={<VipSuccess />} />
          
          <Route path="/dashboard/guest" element={<GuestDashboard />} />
          <Route path="/dashboard/landlord" element={<LandlordDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/list-property" element={<ListYourProperty />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>

      {/* Conditionally hide the Footer on Dashboards */}
      {!location.pathname.startsWith('/dashboard') && <Footer />}
    </div>
  );
}

export default App;
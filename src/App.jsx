import { useState } from 'react';
import { Routes, Route ,useLocation } from 'react-router-dom';
import './index.css';
import WelcomeOverlay from './components/WelcomeOverlay';
import CitySelectorModal from "./components/CitySelectorModal"
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

// 1. Define the tracker completely outside the component memory
let hasSeenCityModalThisSession = false;

function App() {
  const [activeCategory, setActiveCategory] = useState('shortlet');
  const [searchFilters, setSearchFilters] = useState({});
  
  // 2. Initialize the state using the tracker's inverse value
  const [showCityModal, setShowCityModal] = useState(!hasSeenCityModalThisSession);
  
  // Initialize useLocation to track the current route
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const handleCitySelect = (selectedState) => {
    // 3. Update the tracker so it remembers the selection globally
    hasSeenCityModalThisSession = true;
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
      
      {/* 
        Header Wrapper: Reverted to z-50. 
        This ensures WelcomeOverlay can naturally cover the header again.
      */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm flex flex-col">
        
        {/* 
          Navbar Wrapper: 
          Mobile: z-40 (Yields to the mobile search modal).
          Desktop (md:): z-[99] (Highest priority so Auth dropdown crushes the red search button).
        */}
        <div className="relative z-40 md:z-[99]">
          <Navbar 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </div>
        
        {/* 
          AdvancedSearch Wrapper: 
          Mobile: z-[60] (Escapes the Navbar to cover the screen).
          Desktop (md:): z-30 (Stays quietly underneath the dropdown).
        */}
        {isHomePage && (
          <div className="relative z-[60] md:z-30 pb-4 bg-white">
            <AdvancedSearch 
            activeCategory={activeCategory}
            onSearch={setSearchFilters} />
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
              />
            } 
          />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          
          <Route path="/hotel/:id" element={<HotelDetails />} />
          
          <Route path="/dashboard/guest" element={<GuestDashboard />} />
          <Route path="/dashboard/landlord" element={<LandlordDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Routes>
      </div>

      {/* Conditionally hide the Footer on Dashboards if they have their own full-screen layout */}
      {!location.pathname.startsWith('/dashboard') && <Footer />}
    </div>
  );
}

export default App;
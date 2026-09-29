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

function App() {
  const [activeCategory, setActiveCategory] = useState('shortlet');
  const [searchFilters, setSearchFilters] = useState({});
  const [showCityModal, setShowCityModal] = useState(true);
  
  // 1. Initialize useLocation to track the current route
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const handleCitySelect = (selectedState) => {
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
        2. Consolidated Header Wrapper: 
        Maintains the sticky property for the whole header block 
      */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm flex flex-col">
        <Navbar 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />
        
        {/* 3. Elevated wrapper to z-[70] so the search bar escapes the Navbar shadow */}
        {isHomePage && (
          <div className="relative z-[70] pb-4 bg-white">
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
          
          {/* <-- 2. ADD THE HOTEL ROUTE HERE --> */}
          <Route path="/hotel/:id" element={<HotelDetails />} />
          
          {/* Role-Based Dashboard Placeholders */}
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
import { useState } from 'react';
import { Routes, Route ,useLocation } from 'react-router-dom';
import './index.css';
import WelcomeOverlay from './components/WelcomeOverlay';
import CitySelectorModal from "./components/CitySelectorModal"
import Navbar from './components/Navbar';
import AdvancedSearch from './components/AdvancedSearch';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
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
        Removed the global pb-4 so dashboards sit perfectly flush against the Navbar 
      */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm flex flex-col">
        <Navbar 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />
        
        {/* 3. Conditionally render AdvancedSearch AND its padding ONLY on the Home Page */}
        {isHomePage && (
          <div className="relative z-30 pb-4">
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

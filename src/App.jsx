import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
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

  // This function receives the selected city, hides the modal, and triggers the search
  const handleCitySelect = (selectedState) => {
    setSearchFilters({ ...searchFilters, location: selectedState });
    setShowCityModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <WelcomeOverlay />
      
      {/* 
        Only show this modal if:
        1. They haven't selected a city yet
        2. They are on the shortlet tab
      */}
      {showCityModal && activeCategory === 'shortlet' && (
        <CitySelectorModal onSelect={handleCitySelect} />
      )}
      
      <div className="sticky top-0 z-40 bg-white pb-4 border-b border-gray-100 shadow-sm flex flex-col">
        {/* Z-50 forces the Navbar and its dropdowns to float above everything else */}
        <div className="relative z-50">
          <Navbar 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </div>
        
        {/* Z-30 keeps the search bar safely beneath the Navbar's dropdown */}
        <div className="relative z-30">
          <AdvancedSearch onSearch={setSearchFilters} />
        </div>
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

      <Footer />
    </div>
  );
}

export default App;
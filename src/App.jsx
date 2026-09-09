import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.css';
import WelcomeOverlay from './components/WelcomeOverlay';
import Navbar from './components/Navbar';
import AdvancedSearch from './components/AdvancedSearch';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Footer from './components/Footer';

function App() {
  const [activeCategory, setActiveCategory] = useState('apartment');
  const [searchFilters, setSearchFilters] = useState({});

  return (
    <div className="min-h-screen flex flex-col relative">
      <WelcomeOverlay />
      
      <div className="sticky top-0 z-40 bg-white pb-4 border-b border-gray-100 shadow-sm">
        <Navbar 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />
        <AdvancedSearch onSearch={setSearchFilters} />
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
          
          {/* Role-Based Dashboard Placeholders */}
          <Route path="/dashboard/guest" element={<div className="p-12 text-center text-2xl font-bold text-brand-dark">Guest Dashboard</div>} />
          <Route path="/dashboard/landlord" element={<div className="p-12 text-center text-2xl font-bold text-brand-dark">Landlord Dashboard</div>} />
          <Route path="/dashboard/admin" element={<div className="p-12 text-center text-2xl font-bold text-brand-dark">Rentals Admin Dashboard</div>} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
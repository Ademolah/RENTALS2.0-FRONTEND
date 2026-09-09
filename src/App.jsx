import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import WelcomeOverlay from './components/WelcomOverlay';
import Navbar from './components/Navbar';
import AdvancedSearch from './components/AdvancedSearch';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative">
        <WelcomeOverlay />
        
        {/* Persistent Header across routes */}
        <div className="sticky top-0 z-40 bg-white pb-4 border-b border-gray-100 shadow-sm">
          <Navbar />
          <AdvancedSearch />
        </div>

        {/* Dynamic Page Views */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
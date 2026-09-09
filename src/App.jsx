import './index.css';
import WelcomeOverlay from  "./components/WelcomOverlay"
import Navbar from './components/Navbar';
import AdvancedSearch from './components/AdvancedSearch';
import Home from './pages/Home';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <WelcomeOverlay />
      
      {/* Header section includes Navbar and Search */}
      <div className="sticky top-0 z-40 bg-white pb-4 border-b border-gray-100 shadow-sm">
        <Navbar />
        <AdvancedSearch />
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        <Home />
      </div>

      <Footer />
    </div>
  );
}

export default App;
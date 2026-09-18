import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Key, Building2, Menu, UserCircle, LogOut, LayoutDashboard,
  CarFront, Crown 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../context/AuthModal'; // SURGICAL FIX: Corrected import path

export default function Navbar({ activeCategory, onCategoryChange }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, redirectUserByRole } = useAuth();

  const categories = [
    { id: 'shortlet', label: 'Shortlets', icon: Key },
    { id: 'car', label: 'Car Rentals', icon: CarFront },
    { id: 'vip', label: 'VIP Reservations', icon: Crown },
    { id: 'hotel', label: 'Hotels', icon: Building2 },
  ];

  // Dynamically change the CTA button text based on what the user is currently browsing
  const getCtaText = () => {
    switch (activeCategory) {
      case 'car': return 'List your vehicle';
      case 'vip': return 'List your venue';
      case 'hotel': return 'List your hotel';
      default: return 'List your property';
    }
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center text-brand-primary">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center mr-2 shadow-sm">
                <span className="text-white text-xl font-bold">R</span>
              </div>
              <span className="font-bold text-2xl hidden lg:block text-brand-primary tracking-tight">
                Rentals
              </span>
            </Link>

            {/* DESKTOP CATEGORY NAVIGATION */}
            <div className="hidden md:flex flex-1 justify-center px-8">
              <div className="flex space-x-1 bg-gray-50 p-1 rounded-full border border-gray-100 shadow-inner">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onCategoryChange && onCategoryChange(cat.id)}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-white shadow-sm text-brand-dark' 
                          : 'text-gray-500 hover:text-brand-dark hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : ''}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDE: List Property & Auth Menu */}
            <div className="flex items-center space-x-2 md:space-x-4">
              
              {/* Context-Aware Desktop Hosting Button */}
              <button 
                onClick={() => user ? redirectUserByRole('LANDLORD') : setIsAuthOpen(true)}
                className="hidden md:block text-sm font-semibold text-brand-dark hover:bg-gray-50 px-4 py-2.5 rounded-full transition-colors"
              >
                {getCtaText()}
              </button>

              {/* AUTH / PROFILE MENU */}
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-3 border border-gray-200 p-2 pl-4 rounded-full hover:shadow-md transition-shadow bg-white"
                >
                  <Menu className="w-5 h-5 text-gray-500" />
                  <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm">
                    {user ? user.firstName?.[0]?.toUpperCase() : <UserCircle className="w-8 h-8 text-gray-400" />}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-sm font-bold text-brand-dark truncate">{user.firstName} {user.lastName}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-600 rounded-md uppercase">
                            {user.role}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => { setIsMenuOpen(false); redirectUserByRole(user.role); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-500" />
                          <span>Dashboard</span>
                        </button>

                        <button
                          onClick={() => { setIsMenuOpen(false); logout(); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-100"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Log Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setIsMenuOpen(false); setIsAuthOpen(true); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                        >
                          Log in / Sign up
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 pb-safe">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange && onCategoryChange(cat.id)}
                className="flex flex-col items-center justify-center w-full h-full space-y-1"
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-brand-dark' : 'text-gray-500'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
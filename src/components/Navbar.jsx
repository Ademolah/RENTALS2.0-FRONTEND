import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Key, Building2, Menu, UserCircle, LogOut, LayoutDashboard,
  CarFront, Crown ,  ChevronRight, User as UserIcon, 
  Sparkles, LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// Ensure this path points to your actual AuthModal location
import AuthModal from './AuthModal'

export default function Navbar({ activeCategory, onCategoryChange }) {
  // 1. DELETE LOCAL MODAL STATE
  // const [isAuthOpen, setIsAuthOpen] = useState(false); 
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 2. IMPORT GLOBAL MODAL STATE FROM CONTEXT
  const { user, logout, redirectUserByRole, showAuthModal, setShowAuthModal } = useAuth();

  const categories = [
    { id: 'shortlet', label: 'Shortlets', icon: Key },
    { id: 'car', label: 'Car Rentals', icon: CarFront },
    { id: 'vip', label: 'VIP Reservations', icon: Crown },
    { id: 'hotel', label: 'Hotels', icon: Building2 },
  ];

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
      <nav className="sticky top-0 z-[99999] w-full bg-white border-b border-gray-100 shadow-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex-shrink-0">
            <Link to="/" className="flex items-center group">
              <img 
                src="/Rentals-Navbar.png" 
                alt="Rentals Platform" 
                className="h-6 w-auto sm:h-7 md:h-8 object-contain transition-transform duration-300 group-hover:scale-[1.02] select-none"
                draggable="false"
              />
            </Link>
          </div>


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

            <div className="flex items-center space-x-2 md:space-x-4">
              {/* 3. UPDATE CTA BUTTON TO USE GLOBAL STATE */}
              <button 
                onClick={() => user ? redirectUserByRole('LANDLORD') : setShowAuthModal(true)}
                className="hidden md:block text-sm font-semibold text-brand-dark hover:bg-gray-50 px-4 py-2.5 rounded-full transition-colors"
              >
                {getCtaText()}
              </button>

              <div className="relative z-[99999]">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-3 border border-gray-200 p-2 pl-4 rounded-full hover:shadow-md transition-shadow bg-white"
                >
                  <Menu className="w-5 h-5 text-gray-500" />
                  <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm">
                    {user ? user.firstName?.[0]?.toUpperCase() : <UserCircle className="w-8 h-8 text-gray-400" />}
                  </div>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 p-2 z-[99999] animate-in fade-in slide-in-from-top-2 origin-top-right duration-200 mobile-menu-open">
                    {user ? (
                      <>
                        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-4 relative overflow-hidden group cursor-default shadow-md">
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite] transition-all duration-1000"></div>
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">
                            Welcome Back
                          </p>
                          <p className="text-lg font-bold text-white truncate drop-shadow-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md border border-white/10">
                            {(user.role === 'LANDLORD' || user.role === 'ADMIN') && (
                              <Crown className="w-3 h-3 text-amber-400" />
                            )}
                            <span className="text-[9px] font-bold text-gray-100 uppercase tracking-widest">
                              {user.role === 'USER' ? 'Guest' : 'Host'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <button
                            onClick={() => { setIsMenuOpen(false); redirectUserByRole(user.role); }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors text-gray-500">
                                <LayoutDashboard className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Control Panel</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                          </button>

                          <button
                            onClick={() => { setIsMenuOpen(false); redirectUserByRole(user.role); }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors text-gray-500">
                                <UserIcon className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Profile Settings</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                          </button>
                        </div>

                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <button
                            onClick={() => { setIsMenuOpen(false); logout(); }}
                            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all group"
                          >
                            <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm font-bold">Secure Logout</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-1">
                        <div className="relative bg-black rounded-2xl p-6 border border-neutral-800 shadow-2xl text-left">
  
  {/* Architectural Corner Accent */}
  <div className="flex items-center space-x-3 mb-5">
    <div className="w-1 h-3.5 bg-amber-400 rounded-full"></div>
    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
      Member Portal
    </span>
  </div>

  {/* Headline & Subtitle */}
  <h4 className="text-xl font-extrabold text-neutral-100 tracking-tight leading-snug">
    Exclusive Access
  </h4>
  
  <p className="text-xs font-normal text-neutral-400 mt-2 mb-6 leading-relaxed">
    Sign in to manage your reservations, access saved shortlets, and unlock private VIP fleet rentals.
  </p>

  {/* High-End Primary Button */}
  <button
    onClick={() => { setIsMenuOpen(false); setShowAuthModal(true); }}
    className="w-full py-3.5 bg-neutral-100 hover:bg-white text-black rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 active:scale-[0.98]"
  >
    Sign In or Register
  </button>
  
</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[99999]">
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

      {/* 5. PASS THE GLOBAL CONTEXT TO THE MODAL COMPONENT */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
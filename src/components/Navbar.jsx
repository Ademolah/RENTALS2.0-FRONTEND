import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Key, Building2, Menu, UserCircle, LogOut, LayoutDashboard,
  CarFront, Crown, ChevronRight, User as UserIcon,
  Sparkles, LogIn, Bell, MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar({ activeCategory, onCategoryChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, redirectUserByRole, showAuthModal, setShowAuthModal } = useAuth();

  const categories = [
    { id: 'shortlet', label: 'Shortlets', icon: Key },
    { id: 'car', label: 'Car Rentals', icon: CarFront },
    { id: 'vip', label: 'VIP Services', icon: Crown },
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
      <nav className="sticky top-0 z-[99999] w-full bg-white/95 backdrop-blur-md border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center group">
                <img
                  src="/Rentals-Navbar.png"
                  alt="Rentals Africa"
                  className="h-6 w-auto sm:h-7 object-contain transition-transform duration-300 group-hover:scale-[1.02] select-none"
                  draggable="false"
                />
              </Link>
            </div>

            {/* Desktop Category Tabs — pill switcher matching mobile chip row */}
            <div className="hidden md:flex flex-1 justify-center px-8">
              <div className="flex space-x-1 bg-brand-accent-soft p-1 rounded-full border border-gray-100">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onCategoryChange?.(cat.id)}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white shadow-soft text-brand-dark font-semibold'
                          : 'text-brand-text-secondary hover:text-brand-dark hover:bg-white/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : ''}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Host CTA */}
              <button
                onClick={() => user ? redirectUserByRole('LANDLORD') : setShowAuthModal(true)}
                className="hidden md:block text-sm font-semibold text-brand-dark hover:bg-brand-accent-soft px-4 py-2.5 rounded-full transition-colors"
              >
                {getCtaText()}
              </button>

              {/* Profile Menu Trigger */}
              <div className="relative z-[99999]">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2.5 border border-gray-200 p-1.5 pl-3.5 rounded-full hover:shadow-card transition-all bg-white"
                >
                  <Menu className="w-4 h-4 text-brand-text-muted" />
                  <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center font-display font-bold text-sm">
                    {user ? user.firstName?.[0]?.toUpperCase() : <UserCircle className="w-7 h-7 text-gray-300" />}
                  </div>
                </button>

                {/* Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-elevated border border-gray-100 p-2 z-[99999] animate-in fade-in slide-in-from-top-2 origin-top-right duration-200 mobile-menu-open">
                    {user ? (
                      <>
                        {/* User Card */}
                        <div className="bg-gradient-to-br from-brand-accent to-brand-dark rounded-xl p-4 relative overflow-hidden group cursor-default">
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite] transition-all duration-1000"></div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text-muted mb-1">
                            Welcome Back
                          </p>
                          <p className="text-lg font-display font-bold text-white truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md border border-white/10">
                            {(user.role === 'LANDLORD' || user.role === 'ADMIN') && (
                              <Crown className="w-3 h-3 text-brand-star" />
                            )}
                            <span className="text-[9px] font-bold text-gray-200 uppercase tracking-[0.2em]">
                              {user.role === 'USER' ? 'Guest' : 'Host'}
                            </span>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="mt-2 space-y-0.5">
                          <button
                            onClick={() => { setIsMenuOpen(false); redirectUserByRole(user.role); }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-brand-accent-soft transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="bg-brand-accent-soft p-2 rounded-lg group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors text-brand-text-secondary">
                                <LayoutDashboard className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-semibold text-brand-text group-hover:text-brand-dark">Dashboard</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
                          </button>

                          <button
                            onClick={() => { setIsMenuOpen(false); redirectUserByRole(user.role); }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-brand-accent-soft transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="bg-brand-accent-soft p-2 rounded-lg group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors text-brand-text-secondary">
                                <UserIcon className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-semibold text-brand-text group-hover:text-brand-dark">Profile</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
                          </button>
                        </div>

                        {/* Logout */}
                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <button
                            onClick={() => { setIsMenuOpen(false); logout(); }}
                            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 text-brand-text-secondary hover:text-red-600 transition-all group"
                          >
                            <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm font-semibold">Sign Out</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-1">
                        <div className="relative bg-brand-dark rounded-2xl p-6 border border-brand-dark-border text-left">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-1 h-3.5 bg-brand-primary rounded-full"></div>
                            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">
                              Member Access
                            </span>
                          </div>

                          <h4 className="text-xl font-display font-bold text-white tracking-tight leading-snug">
                            Welcome to Rentals
                          </h4>

                          <p className="text-xs text-brand-text-muted mt-2 mb-5 leading-relaxed">
                            Sign in to manage reservations, saved stays, and VIP services.
                          </p>

                          <button
                            onClick={() => { setIsMenuOpen(false); setShowAuthModal(true); }}
                            className="w-full py-3 bg-white hover:bg-gray-50 text-brand-dark rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 active:scale-[0.98]"
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

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-[99999]">
        <div className="flex justify-around items-center h-16 pb-safe">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange?.(cat.id)}
                className="flex flex-col items-center justify-center w-full h-full space-y-1"
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-primary' : 'text-brand-text-muted'}`} />
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-brand-dark font-semibold' : 'text-brand-text-muted'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

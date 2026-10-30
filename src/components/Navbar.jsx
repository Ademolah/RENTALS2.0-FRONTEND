import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Key, Building2, Menu, UserCircle, LogOut, LayoutDashboard,
  CarFront, Crown, ChevronRight, User as UserIcon,
  Briefcase, Heart, Bell, LifeBuoy
} from 'lucide-react';
import { getUnreadCountApi } from '../api/user';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar({ activeCategory, onCategoryChange }) {
  const navigate = useNavigate();
  const selectCategory = (id) => {
    onCategoryChange?.(id);
    navigate('/');
    window.scrollTo({ top: 0 });
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, redirectUserByRole, showAuthModal, setShowAuthModal } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let active = true;
    getUnreadCountApi().then((n) => active && setUnread(n)).catch(() => active && setUnread(0));
    return () => { active = false; };
  }, [user, isMenuOpen]);

  const menuLinks = [
    { to: '/trips', label: 'Trips', icon: Briefcase },
    { to: '/saved', label: 'Saved', icon: Heart },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unread },
    { to: '/profile', label: 'Profile', icon: UserIcon },
    { to: '/help', label: 'Help', icon: LifeBuoy },
  ];

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
      <nav className="sticky top-0 z-[99999] w-full bg-white border-b border-gray-100">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img
                  src="/Rentals-Navbar.png"
                  alt="Rentals Africa"
                  className="h-6 w-auto sm:h-7 object-contain select-none"
                  draggable="false"
                />
              </Link>
            </div>

            {/* Desktop Category Tabs */}
            <div className="hidden md:flex flex-1 justify-center px-8">
              <div className="flex gap-1 p-1 bg-gray-50 rounded-full">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => selectCategory(cat.id)}
                      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white shadow-sm text-brand-dark font-semibold'
                          : 'text-brand-text-secondary hover:text-brand-dark'
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => user ? redirectUserByRole('LANDLORD') : setShowAuthModal(true)}
                className="hidden md:block text-base font-medium text-brand-dark hover:bg-gray-50 px-4 py-2.5 rounded-full transition-colors"
              >
                {getCtaText()}
              </button>

              {/* Profile Menu Trigger */}
              <div className="relative z-[99999]">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative flex items-center gap-2 border border-gray-200 p-1.5 pl-3 rounded-full hover:shadow-card transition-all bg-white"
                >
                  <Menu className="w-4 h-4 text-brand-text-muted" />
                  {unread > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-primary border-2 border-white" aria-label={`${unread} unread notifications`} />}
                  <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center font-display font-bold text-sm">
                    {user ? user.firstName?.[0]?.toUpperCase() : <UserCircle className="w-7 h-7 text-gray-300" />}
                  </div>
                </button>

                {/* Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-elevated border border-gray-100 p-2 z-[99999] animate-fade-up mobile-menu-open">
                    {user ? (
                      <>
                        <div className="bg-gradient-to-br from-brand-accent to-brand-dark rounded-xl p-4 relative overflow-hidden">
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-1">
                            Welcome Back
                          </p>
                          <p className="text-lg font-display font-bold text-white truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-md">
                            {(user.role === 'LANDLORD' || user.role === 'ADMIN') && (
                              <Crown className="w-3 h-3 text-brand-star" />
                            )}
                            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                              {user.role === 'USER' ? 'Guest' : 'Host'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-1.5 space-y-0.5">
                          <button
                            onClick={() => { setIsMenuOpen(false); redirectUserByRole(user.role); }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gray-50 group-hover:bg-brand-primary/10 rounded-lg flex items-center justify-center transition-colors">
                                <LayoutDashboard className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-primary" />
                              </div>
                              <span className="text-base font-medium text-brand-dark">Dashboard</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </button>

                          {menuLinks.map(({ to, label, icon: Icon, badge }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setIsMenuOpen(false)}
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gray-50 group-hover:bg-brand-primary/10 rounded-lg flex items-center justify-center transition-colors">
                                  <Icon className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-primary" />
                                </div>
                                <span className="text-base font-medium text-brand-dark">{label}</span>
                              </div>
                              {badge > 0 ? (
                                <span className="min-w-6 h-6 px-1.5 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">{badge > 99 ? '99+' : badge}</span>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                              )}
                            </Link>
                          ))}
                        </div>

                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <button
                            onClick={() => { setIsMenuOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-brand-text-secondary hover:text-red-600 transition-colors"
                          >
                            <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <span className="text-base font-medium">Sign Out</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-1">
                        <div className="bg-brand-dark rounded-xl p-5 border border-brand-dark-border">
                          <p className="text-xs font-bold text-white/40 uppercase tracking-[0.15em] mb-2">
                            Member Access
                          </p>
                          <h4 className="text-lg font-display font-bold text-white tracking-tight mb-1.5">
                            Welcome to Rentals
                          </h4>
                          <p className="text-sm text-white/40 mb-4 leading-relaxed">
                            Sign in to manage reservations, saved stays, and VIP services.
                          </p>
                          <button
                            onClick={() => { setIsMenuOpen(false); setShowAuthModal(true); }}
                            className="w-full py-2.5 bg-white text-brand-dark rounded-lg text-sm font-semibold transition-colors hover:bg-gray-50 active:scale-[0.98]"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-[99999]">
        <div className="flex justify-around items-center h-16 pb-safe">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className="flex flex-col items-center justify-center w-full h-full gap-1"
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-primary' : 'text-brand-text-muted'}`} />
                <span className={`text-xs transition-colors ${isActive ? 'text-brand-dark font-semibold' : 'text-brand-text-muted'}`}>
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

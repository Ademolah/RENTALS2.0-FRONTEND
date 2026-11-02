import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, Building2, UserCircle, LogOut, CarFront, Crown, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import AuthModal from './AuthModal'

export default function Navbar({ activeCategory, onCategoryChange }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, redirectUserByRole, showAuthModal, setShowAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    apiClient.get('/notifications')
      .then(res => {
        const list = res.data?.data?.notifications || res.data?.notifications || res.data || [];
        const arr = Array.isArray(list) ? list : [];
        setUnreadCount(arr.filter(n => !n.isRead).length);
      })
      .catch(() => setUnreadCount(0));
  }, [user]);

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
      <nav className="sticky top-0 z-[99999] w-full bg-white border-b border-gray-100 shadow-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex-shrink-0">
            <Link to="/" className="flex items-center group">
              <img
                src="/logo-coral.png"
                alt="Rentals Africa"
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

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard/guest?tab=NOTIFICATIONS')}
                    className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-brand-primary text-white text-[9px] font-extrabold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => redirectUserByRole(user.role)}
                    className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm hover:opacity-90 transition-opacity"
                    aria-label="Dashboard"
                  >
                    {user.firstName?.[0]?.toUpperCase() || <UserCircle className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => logout()}
                    className="p-2.5 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors text-gray-400"
                    aria-label="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="hidden md:block text-sm font-semibold text-brand-dark hover:bg-gray-50 px-4 py-2.5 rounded-full transition-colors"
                  >
                    {getCtaText()}
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-full text-sm font-bold transition-colors"
                  >
                    Sign In
                  </button>
                </>
              )}
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
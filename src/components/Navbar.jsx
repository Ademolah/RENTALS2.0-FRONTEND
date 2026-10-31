import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, LogOut, LayoutDashboard, ChevronRight, Repeat,
  User as UserIcon, Briefcase, Heart, Bell, LifeBuoy, Store, Plane,
} from 'lucide-react';
import { getUnreadCountApi } from '../api/user';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar({ center }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, showAuthModal, setShowAuthModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  const isHost = String(user?.role || '').toUpperCase() === 'LANDLORD';
  const hostMode = pathname.startsWith('/dashboard/landlord');
  const dark = hostMode && isHost;

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let active = true;
    getUnreadCountApi().then((n) => active && setUnread(n)).catch(() => active && setUnread(0));
    return () => { active = false; };
  }, [user, pathname]);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const guestLinks = [
    { to: '/trips', label: 'Trips', icon: Briefcase },
    { to: '/saved', label: 'Saved', icon: Heart },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unread },
    { to: '/help', label: 'Help', icon: LifeBuoy },
  ];
  const hostLinks = [
    { to: '/dashboard/landlord', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unread },
    { to: '/help', label: 'Help', icon: LifeBuoy },
  ];
  const links = user ? (dark ? hostLinks : guestLinks) : [{ to: '/help', label: 'Help', icon: LifeBuoy }];

  // With the search bar in the header there is less room, so labels appear only on very wide screens.
  const labelCls = center ? 'hidden 2xl:inline' : 'hidden xl:inline';

  const linkClass = ({ isActive }) =>
    `relative flex items-center gap-2 px-3 py-2.5 rounded-full text-base font-medium transition-colors ${
      dark
        ? isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white hover:bg-white/10'
        : isActive ? 'bg-brand-accent-soft text-brand-dark' : 'text-brand-text-secondary hover:text-brand-dark hover:bg-gray-50'
    }`;

  const initial = user?.firstName?.[0]?.toUpperCase();
  const goBecomeHost = () => navigate('/list-property');

  const switchButton = user && isHost ? (
    dark ? (
      <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full bg-white text-brand-dark text-base font-semibold hover:bg-gray-100 transition-colors">
        <Plane className="w-4 h-4" /> <span>Switch to traveling</span>
      </button>
    ) : (
      <button onClick={() => navigate('/dashboard/landlord')} className="inline-flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full bg-brand-dark text-white text-base font-semibold hover:bg-brand-accent transition-colors">
        <Store className="w-4 h-4" /> <span>Switch to hosting</span>
      </button>
    )
  ) : (
    <button onClick={goBecomeHost} className="px-4 py-2.5 rounded-full text-base font-semibold text-brand-dark hover:bg-gray-50 transition-colors whitespace-nowrap">
      Become a host
    </button>
  );

  return (
    <>
      <nav className={`sticky top-0 z-[99999] w-full border-b ${dark ? 'bg-brand-dark border-white/10' : 'bg-white border-gray-100'}`}>
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-center lg:h-[72px]">

            {/* Logo */}
            <div className="flex-shrink-0 h-16 lg:h-auto flex items-center gap-3">
              <Link to="/" className="flex items-center">
                <img src="/Rentals-Navbar.png" alt="Rentals Africa" className="h-6 w-auto sm:h-7 object-contain select-none" draggable="false" />
              </Link>
              {dark && (
                <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold uppercase tracking-[0.18em]">Hosting</span>
              )}
            </div>

            {/* Search (centre on desktop, own row below on small screens) */}
            {center && !dark && (
              <div className="order-last basis-full pb-3 lg:order-none lg:basis-auto lg:flex-1 lg:min-w-0 lg:px-6 lg:pb-0">{center}</div>
            )}

            {/* Desktop links */}
            <div className={`hidden lg:flex items-center gap-1 ${center && !dark ? '' : 'flex-1 justify-end'} `}>
              {links.map(({ to, label, icon: Icon, badge }) => (
                <NavLink key={to} to={to} end className={linkClass} aria-label={label} title={label}>
                  <Icon className="w-5 h-5" />
                  <span className={center && !dark ? labelCls : ''}>{label}</span>
                  {badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">{badge > 99 ? '99+' : badge}</span>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-3 h-16 lg:h-auto lg:ml-3" ref={menuRef}>
              <div className="hidden lg:block">{switchButton}</div>

              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden lg:inline-flex whitespace-nowrap px-5 py-2.5 rounded-full bg-brand-dark text-white text-base font-semibold hover:bg-brand-accent transition-colors"
                >
                  Sign in
                </button>
              )}

              <div className="relative">
                {/* Desktop: avatar only. Phones and tablets: menu button */}
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                  className={`flex items-center gap-2 rounded-full border transition-all ${
                    dark ? 'border-white/25 bg-white/10 hover:bg-white/15' : 'border-gray-200 bg-white hover:shadow-card'
                  } ${user ? 'p-1.5 pl-3 lg:p-1 lg:pl-1' : 'p-2.5 lg:hidden'}`}
                >
                  <span className="lg:hidden">{menuOpen ? <X className={`w-5 h-5 ${dark ? 'text-white' : 'text-brand-dark'}`} /> : <Menu className={`w-5 h-5 ${dark ? 'text-white' : 'text-brand-dark'}`} />}</span>
                  {user && (
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-base ${dark ? 'bg-white text-brand-dark' : 'bg-brand-dark text-white'}`}>
                      {initial || <UserIcon className="w-5 h-5" />}
                    </span>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-elevated border border-gray-100 p-2 z-[99999] animate-fade-up">
                    {user ? (
                      <>
                        <div className="bg-gradient-to-br from-brand-accent to-brand-dark rounded-xl p-4">
                          <p className="text-lg font-display font-bold text-white truncate">{user.firstName} {user.lastName}</p>
                          <p className="mt-1 inline-block px-2.5 py-0.5 bg-white/15 rounded-md text-xs font-semibold text-white/80 uppercase tracking-wider">
                            {isHost ? (dark ? 'Hosting mode' : 'Host account') : 'Guest account'}
                          </p>
                        </div>

                        {/* Mode switch is always one tap away */}
                        {isHost ? (
                          <button
                            onClick={() => navigate(dark ? '/' : '/dashboard/landlord')}
                            className="mt-2 w-full flex items-center justify-between p-3 rounded-xl bg-brand-accent-soft hover:bg-gray-200 transition-colors"
                          >
                            <span className="flex items-center gap-3 text-base font-semibold text-brand-dark">
                              <Repeat className="w-5 h-5" /> {dark ? 'Switch to traveling' : 'Switch to hosting'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                        ) : (
                          <button
                            onClick={goBecomeHost}
                            className="mt-2 w-full flex items-center justify-between p-3 rounded-xl bg-brand-accent-soft hover:bg-gray-200 transition-colors"
                          >
                            <span className="flex items-center gap-3 text-base font-semibold text-brand-dark"><Store className="w-5 h-5" /> Become a host</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                        )}

                        <div className="mt-1 space-y-0.5 lg:hidden">
                          {links.map(({ to, label, icon: Icon, badge }) => (
                            <Link key={to} to={to} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                              <span className="flex items-center gap-3 text-base font-medium text-brand-dark"><Icon className="w-5 h-5 text-brand-text-secondary" /> {label}</span>
                              {badge > 0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">{badge}</span>}
                            </Link>
                          ))}
                        </div>

                        <div className="mt-1 space-y-0.5">
                          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-base font-medium text-brand-dark">
                            <UserIcon className="w-5 h-5 text-brand-text-secondary" /> Profile
                          </Link>
                          <button
                            onClick={() => { setMenuOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-base font-medium text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <LogOut className="w-5 h-5" /> Sign out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 space-y-1">
                        <p className="px-2 pt-1 text-lg font-display font-bold text-brand-dark">Welcome to Rentals</p>
                        <p className="px-2 pb-2 text-base text-brand-text-secondary">Sign in to manage trips, saved stays and bookings.</p>
                        <button
                          onClick={() => { setMenuOpen(false); setShowAuthModal(true); }}
                          className="w-full py-3 bg-brand-dark text-white rounded-xl text-base font-semibold hover:bg-brand-accent transition-colors"
                        >
                          Sign in or register
                        </button>
                        <Link to="/help" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-base font-medium text-brand-dark">
                          <LifeBuoy className="w-5 h-5 text-brand-text-secondary" /> Help
                        </Link>
                        <Link to="/list-property" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-base font-medium text-brand-dark">
                          <Store className="w-5 h-5 text-brand-text-secondary" /> Become a host
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

import { NavLink, Link } from 'react-router-dom';
import { CalendarCheck, Heart, Bell, Settings, Crown, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Container, Card, EmptyState, Button, CityBackdrop } from '../ui';

const NAV = [
  { to: '/trips', label: 'Trips', icon: CalendarCheck },
  { to: '/saved', label: 'Saved', icon: Heart },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/guest', label: 'Account', icon: Settings },
];

export function AccountShell({ title, subtitle, actions, children }) {
  const { user, setShowAuthModal } = useAuth();

  if (!user) {
    return (
      <Container className="py-24">
        <Card>
          <EmptyState
            icon={LogIn}
            title="Sign in to continue"
            text="Your trips, saved stays and notifications live in your account."
            action={<Button onClick={() => setShowAuthModal?.(true)}>Sign in or register</Button>}
          />
        </Card>
      </Container>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <section className="bg-brand-dark relative overflow-hidden">
        <CityBackdrop seed={title} />
        <Container className="relative py-10 md:py-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-primary mb-2">Your account</p>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-lg text-white/70 mt-2 max-w-xl">{subtitle}</p>}
          </div>
          {actions}
        </Container>
      </section>

      <Container className="py-10 flex flex-col lg:flex-row gap-10">
        <nav className="lg:w-64 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0 lg:sticky lg:top-28">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-base transition-all ${
                    isActive ? 'bg-brand-dark text-white shadow-card' : 'text-brand-text-secondary hover:bg-white hover:text-brand-dark'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
            <Link
              to="/list-property"
              className="flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-base text-brand-dark border border-gray-200 bg-white lg:mt-4"
            >
              <Crown className="w-5 h-5 text-brand-text-secondary" /> Become a host
            </Link>
          </div>
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </Container>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-36 rounded-2xl bg-white border border-gray-100 animate-pulse-soft" />
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-lg font-semibold text-brand-dark">{message || 'Something went wrong.'}</p>
      <p className="text-base text-brand-text-secondary mt-1">Check your connection and try again.</p>
      {onRetry && <Button className="mt-5" variant="dark" onClick={onRetry}>Try again</Button>}
    </Card>
  );
}

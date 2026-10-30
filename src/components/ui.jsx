import { Link } from 'react-router-dom';

const BUTTON_VARIANTS = {
  primary: 'bg-brand-primary text-white hover:bg-brand-hover shadow-glow',
  dark: 'bg-brand-dark text-white hover:bg-brand-accent',
  outline: 'bg-white text-brand-dark border border-gray-200 hover:border-brand-dark',
  soft: 'bg-brand-accent-soft text-brand-dark hover:bg-gray-200',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#20bd5a]',
  ghost: 'text-brand-dark hover:bg-gray-50',
};

const BUTTON_SIZES = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', to, className = '', children, ...props }) {
  const cls = `inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
  if (to) return <Link to={to} className={cls} {...props}>{children}</Link>;
  return <button className={cls} {...props}>{children}</button>;
}

const BADGE_TONES = {
  brand: 'bg-brand-primary-soft text-brand-primary',
  dark: 'bg-brand-dark text-white',
  green: 'bg-status-available-soft text-status-available',
  amber: 'bg-brand-warning-soft text-brand-warning',
  gray: 'bg-gray-100 text-brand-text-secondary',
};

export function Badge({ tone = 'gray', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${BADGE_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Container({ className = '', children }) {
  return <div className={`max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

const CITY_IMAGES = ['/lagos.jpg', '/abuja.jpg'];

export function cityFor(key = '') {
  const n = [...String(key)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return CITY_IMAGES[n % CITY_IMAGES.length];
}

export function CityBackdrop({ seed = '', image }) {
  return (
    <>
      <img src={image || cityFor(seed)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/70 to-brand-dark/30" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-dark/60 to-transparent" />
    </>
  );
}

export function PageHero({ eyebrow, title, subtitle, children, image }) {
  return (
    <section className="bg-brand-dark text-white relative overflow-hidden">
      <CityBackdrop seed={title} image={image} />
      <Container className="relative py-16 md:py-24">
        {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-primary mb-4">{eyebrow}</p>}
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight max-w-3xl">{title}</h1>
        {subtitle && <p className="mt-5 text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      <h2 className="text-2xl md:text-[28px] font-display font-bold text-brand-dark tracking-tight">{title}</h2>
      {subtitle && <p className="text-base text-brand-text-secondary mt-1">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-brand-text-muted" />
        </div>
      )}
      <h3 className="text-xl font-display font-bold text-brand-dark">{title}</h3>
      {text && <p className="text-base text-brand-text-secondary mt-2 max-w-sm">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse-soft bg-gray-100 rounded-xl ${className}`} />;
}

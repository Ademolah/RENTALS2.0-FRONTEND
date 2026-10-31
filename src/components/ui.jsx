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

export function CityBackdrop({ seed = '', image, tone = 'navy' }) {
  const coral = tone === 'coral';
  const gold = tone === 'gold';
  const black = tone === 'black';
  return (
    <>
      <img src={image || cityFor(seed)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      <div className={`absolute inset-0 bg-gradient-to-r ${black ? 'from-black/70 via-black/55 to-black/40' : gold ? 'from-[#FBF4DD]/95 via-[#F8EAC0]/90 to-[#F3DC98]/75' : coral ? 'from-[#D6403D]/95 via-[#E5504D]/88 to-[#F25F5C]/70' : 'from-brand-dark/95 via-brand-dark/85 to-brand-dark/60'}`} />
      <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${black ? 'from-black/40' : gold ? 'from-[#EBCB78]/40' : coral ? 'from-[#B93432]/60' : 'from-brand-dark/70'} to-transparent`} />
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

export function WhatsAppIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ConfirmDialog({ open, title, text, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-fade-up" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md bg-white rounded-3xl shadow-elevated p-8" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="text-2xl font-display font-bold text-brand-dark">{title}</h2>
        {text && <p className="mt-3 text-base text-brand-text-secondary leading-relaxed">{text}</p>}
        <div className="mt-8 flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant={danger ? 'dark' : 'primary'} onClick={onConfirm} disabled={busy} className={danger ? '!bg-red-600 hover:!bg-red-700' : ''}>
            {busy ? 'Please wait...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppCheckout({ onClick, loading = false, disabled = false, className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3 my-4" aria-hidden="true">
        <span className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text-muted">or</span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="group w-full flex items-center gap-4 rounded-2xl bg-[#25D366] hover:bg-[#1FB955] text-white px-4 py-3.5 text-left shadow-lg shadow-[#25D366]/30 ring-4 ring-[#25D366]/15 transition-all active:scale-[0.99] disabled:opacity-70"
      >
        <span className="w-12 h-12 rounded-full bg-white text-[#25D366] flex items-center justify-center shrink-0 shadow-sm">
          <WhatsAppIcon className="w-8 h-8" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-lg font-display font-bold leading-tight">{loading ? 'Opening WhatsApp...' : 'Checkout via WhatsApp'}</span>
          <span className="block text-sm text-white/90 leading-snug">Place your booking directly in a WhatsApp chat</span>
        </span>
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}

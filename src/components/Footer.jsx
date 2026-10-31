import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-gray-200/60 pb-10">
          <div>
            <h4 className="font-display font-bold text-brand-dark mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-base text-brand-text-secondary">
              <li><Link to="/help" className="hover:text-brand-dark transition-colors">Help Center</Link></li>
              <li><Link to="/help#safety" className="hover:text-brand-dark transition-colors">Safety information</Link></li>
              <li><Link to="/help#cancellation" className="hover:text-brand-dark transition-colors">Cancellation options</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-brand-dark mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-base text-brand-text-secondary">
              <li><Link to="/about" className="hover:text-brand-dark transition-colors">About Rentals</Link></li>
              <li><Link to="/help#contact" className="hover:text-brand-dark transition-colors">Contact us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-brand-dark mb-4 text-sm uppercase tracking-wider">Hosting</h4>
            <ul className="space-y-3 text-base text-brand-text-secondary">
              <li><Link to="/list-property" className="hover:text-brand-dark transition-colors">List your property</Link></li>
              <li><Link to="/dashboard/landlord" className="hover:text-brand-dark transition-colors">Host dashboard</Link></li>
            </ul>
          </div>

          {/* App Downloads */}
          <div>
            <h4 className="font-display font-bold text-brand-dark mb-4 text-sm uppercase tracking-wider">Get the App</h4>
            <p className="text-sm text-brand-text-secondary mb-4 leading-relaxed">
              Mobile apps launching soon on Google Play and the App Store
            </p>
            <div className="flex flex-col gap-2">
              <div title="Coming soon" className="relative flex items-center gap-3 px-4 py-3 bg-brand-dark text-white rounded-2xl border border-white/10 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover transition-all cursor-default">
                <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 0 1-.61-1.606V3.42c0-.623.228-1.205.609-1.606z"/>
                  <path fill="#FBBC04" d="M17.556 8.236l-3.764 3.764L13.792 12l3.764 3.764 4.252-2.43a2.38 2.38 0 0 0 0-4.668l-4.252-2.43z"/>
                  <path fill="#4285F4" d="M13.792 12L3.609 1.814A2.378 2.378 0 0 1 5.253 1.35c.618 0 1.22.186 1.737.482l10.566 6.038L13.792 12z"/>
                  <path fill="#34A853" d="M13.792 12l3.764 3.764-10.566 6.038a2.404 2.404 0 0 1-1.737.482 2.378 2.378 0 0 1-1.644-.464L13.792 12z"/>
                </svg>
                <div className="text-left leading-none flex-1">
                  <div className="text-xs uppercase tracking-wide text-white/70 font-medium whitespace-nowrap">Get it on</div>
                  <div className="text-base font-display font-bold text-white mt-1 whitespace-nowrap">Google Play</div>
                </div>
                <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-brand-primary text-white text-xs font-bold uppercase shadow-card">Soon</span>
              </div>

              <div title="Coming soon" className="relative flex items-center gap-3 px-4 py-3 bg-brand-dark text-white rounded-2xl border border-white/10 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover transition-all cursor-default">
                <svg className="w-7 h-7 fill-current text-white flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.65-.79 1.1-1.89.98-2.99-.95.04-2.1.64-2.78 1.43-.61.71-1.14 1.84-.99 2.93 1.06.08 2.14-.58 2.79-1.37z"/>
                </svg>
                <div className="text-left leading-none flex-1">
                  <div className="text-xs uppercase tracking-wide text-white/70 font-medium whitespace-nowrap">Download on the</div>
                  <div className="text-base font-display font-bold text-white mt-1 whitespace-nowrap">App Store</div>
                </div>
                <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-brand-primary text-white text-xs font-bold uppercase shadow-card">Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center pt-8 gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start text-sm text-brand-text-muted gap-x-3 gap-y-1">
            <span>&copy; 2026 Rentals, Inc.</span>
            <span className="hidden md:inline">&middot;</span>
            <Link to="/terms" className="hover:text-brand-dark transition-colors">Terms</Link>
            <span className="hidden md:inline">&middot;</span>
            <Link to="/privacy" className="hover:text-brand-dark transition-colors">Privacy</Link>
            <span className="hidden md:inline">&middot;</span>
            <Link to="/sitemap" className="hover:text-brand-dark transition-colors">Sitemap</Link>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary">
              <Globe className="w-4 h-4" />
              <span>English (NG)</span>
            </span>
            <span className="text-sm font-medium text-brand-text-secondary">
              &#8358; NGN
            </span>
            
          </div>
        </div>
      </div>
    </footer>
  );
}

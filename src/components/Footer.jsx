import { Globe } from 'lucide-react'; // 💡 Keep Globe as it's a utility icon
import { Link } from 'react-router-dom'; // 💡 Keep Link for internal navigation

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 border-b border-gray-200 pb-8">
          <div>
            <h4 className="font-semibold text-brand-dark mb-4 text-sm">Support</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="#" className="hover:underline">Help Center</a></li>
              <li><a href="#" className="hover:underline">Safety information</a></li>
              <li><a href="#" className="hover:underline">Cancellation options</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-dark mb-4 text-sm">Company</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link to="/about" className="hover:underline">
                  About Rentals
                </Link>
              </li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Investors</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-dark mb-4 text-sm">Hosting</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link to="/list-property" className="hover:underline">
                  List your property
                </Link>
              </li>
              <li><a href="#" className="hover:underline">Host resources</a></li>
              <li><a href="#" className="hover:underline">Community forum</a></li>
            </ul>
          </div>

          {/* 💡 SURGICAL INSERTION: Mobile App Downloads Column */}
          <div>
            <h4 className="font-semibold text-brand-dark mb-2 text-sm">Get the App</h4>
            <p className="text-xs font-bold text-gray-800 mb-4 leading-snug">
              Also available on Google Play Store and Apple App Store
            </p>
            <div className="flex flex-col space-y-2.5">
              {/* Google Play Store Badge */}
              <a 
                href="#" 
                className="flex items-center space-x-3 px-3.5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 transition-all shadow-sm group border border-gray-800"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 0 1-.61-1.606V3.42c0-.623.228-1.205.609-1.606z"/>
                  <path fill="#FBBC04" d="M17.556 8.236l-3.764 3.764L13.792 12l3.764 3.764 4.252-2.43a2.38 2.38 0 0 0 0-4.668l-4.252-2.43z"/>
                  <path fill="#4285F4" d="M13.792 12L3.609 1.814A2.378 2.378 0 0 1 5.253 1.35c.618 0 1.22.186 1.737.482l10.566 6.038L13.792 12z"/>
                  <path fill="#34A853" d="M13.792 12l3.764 3.764-10.566 6.038a2.404 2.404 0 0 1-1.737.482 2.378 2.378 0 0 1-1.644-.464L13.792 12z"/>
                </svg>
                <div className="text-left leading-none">
                  <div className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Get it on</div>
                  <div className="text-xs font-extrabold text-white mt-0.5">Google Play</div>
                </div>
              </a>

              {/* Apple App Store Badge */}
              <a 
                href="#" 
                className="flex items-center space-x-3 px-3.5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 transition-all shadow-sm group border border-gray-800"
              >
                <svg className="w-5 h-5 fill-current text-white flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.65-.79 1.1-1.89.98-2.99-.95.04-2.1.64-2.78 1.43-.61.71-1.14 1.84-.99 2.93 1.06.08 2.14-.58 2.79-1.37z"/>
                </svg>
                <div className="text-left leading-none">
                  <div className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Download on the</div>
                  <div className="text-xs font-extrabold text-white mt-0.5">App Store</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center pt-8 gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start text-sm text-gray-600 gap-2">
            <span>© 2026 Rentals, Inc.</span>
            <span className="hidden md:inline">·</span>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <span className="hidden md:inline">·</span>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <span className="hidden md:inline">·</span>
            <Link to="/sitemap" className="hover:underline">Sitemap</Link>
          </div>

          <div className="flex items-center space-x-6 text-brand-dark">
            <button className="flex items-center space-x-2 text-sm font-medium hover:underline">
              <Globe className="w-4 h-4" />
              <span>English (NG)</span>
            </button>
            <button className="text-sm font-medium hover:underline">
              ₦ NGN
            </button>
            <div className="flex space-x-4">
              {/* 💡 Facebook Raw SVG */}
              <a href="#" className="hover:text-brand-primary transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* 💡 Twitter/X Raw SVG */}
              <a href="#" className="hover:text-brand-primary transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* 💡 Instagram Raw SVG */}
              <a href="#" className="hover:text-brand-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
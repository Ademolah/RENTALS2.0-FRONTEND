import { ShieldCheck, X, Menu } from 'lucide-react';
import { NAV_ITEMS } from './adminNav';

function Brand({ className }) {
  return (
    <div className={className}>
      <ShieldCheck className="w-6 h-6 text-brand-dark" />
      <span className="text-base font-display font-bold tracking-wider uppercase text-brand-dark">Rentals Admin</span>
    </div>
  );
}

// Phone top bar, dimmed overlay and the sidebar. `badges` maps a tab id to the count shown beside it.
export default function AdminSidebar({ activeTab, onSelect, badges, mobileOpen, setMobileOpen }) {
  return (
    <>
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <Brand className="flex items-center space-x-2" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`w-64 bg-white border-r border-gray-100 fixed h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Brand className="p-6 border-b border-gray-100 hidden md:flex items-center space-x-2" />

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeCount = badges[item.id] || 0;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-dark text-white shadow-md'
                    : 'text-brand-text-secondary hover:bg-gray-100 hover:text-brand-dark'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-text-muted'}`} />
                <span>{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-dark'}`}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

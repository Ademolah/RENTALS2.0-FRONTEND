import { Plus, Landmark } from 'lucide-react';
import { Button, Container } from '../../ui';
import { ASSET_MENU } from './constants';

export default function DashboardHeader({ menuOpen, onToggleMenu, onPickAsset, onSetupPayouts }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <Container className="py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-primary mb-2">Host Portal</p>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-dark tracking-tight">Portfolio</h1>
            <p className="text-base text-brand-text-secondary mt-1">Manage your listings, reservations and payouts.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={onSetupPayouts}>
              <Landmark className="w-5 h-5 text-brand-text-muted" />
              <span>Setup Payouts</span>
            </Button>

            <div className="relative w-full sm:w-auto">
              <Button variant="dark" onClick={onToggleMenu} className="w-full sm:w-auto">
                <span>Add Asset</span>
                <Plus className={`w-5 h-5 transition-transform duration-300 ${menuOpen ? 'rotate-45' : ''}`} />
              </Button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-full sm:w-80 bg-white border border-gray-100 shadow-elevated z-50 rounded-2xl overflow-hidden animate-fade-up">
                  {ASSET_MENU.map((o) => {
                    const Icon = o.icon;
                    return (
                      <button key={o.key} onClick={() => onPickAsset(o.key)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${o.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-base font-bold text-brand-dark">{o.label}</div>
                          <div className="text-sm text-brand-text-secondary">{o.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

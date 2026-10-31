import { Users, Building, Wallet } from 'lucide-react';

const LABEL = 'text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1';

function CardTitle({ title, Icon }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xs font-display font-bold text-brand-text-muted uppercase tracking-widest">{title}</h3>
      <Icon className="w-4 h-4 text-brand-text-muted" />
    </div>
  );
}

export function NetworkCard({ users }) {
  return (
    <div className="bg-white p-7 border border-gray-100 rounded-2xl shadow-card">
      <CardTitle title="Network" Icon={Users} />
      <div className="space-y-4">
        <div>
          <div className="text-4xl font-display font-bold text-brand-dark tracking-tight">{users.totalUsers}</div>
          <div className="text-sm font-bold text-brand-text-muted mt-1">Total Registered Users</div>
        </div>
        <div className="pt-5 border-t border-gray-100 flex justify-between">
          <div>
            <div className="text-xl font-display font-bold text-brand-dark">{users.totalHosts}</div>
            <div className={LABEL}>Verified Hosts</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-display font-bold text-amber-500">{users.pendingHosts}</div>
            <div className={LABEL}>Pending Apps</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryCard({ assets }) {
  const counts = [
    ['Shortlets', assets.totalShortlets],
    ['Hotels', assets.totalHotels],
    ['VIP Venues', assets.totalVip],
    ['Vehicles', assets.totalCars],
  ];
  return (
    <div className="bg-white p-7 border border-gray-100 rounded-2xl shadow-card">
      <CardTitle title="Live Inventory" Icon={Building} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        {counts.map(([label, value]) => (
          <div key={label}>
            <div className="text-2xl font-display font-bold text-brand-dark">{value}</div>
            <div className={LABEL}>{label}</div>
          </div>
        ))}
      </div>
      {assets.pendingAssets > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <span className="text-xs font-bold text-amber-500">{assets.pendingAssets} Assets Pending Review</span>
        </div>
      )}
    </div>
  );
}

export function FinancialCard({ financials }) {
  return (
    <div className="bg-brand-dark p-6 border border-gray-800 rounded-xl shadow-lg text-white">
      <CardTitle title="Financial Ledger" Icon={Wallet} />
      <div className="space-y-4">
        <div>
          <div className="text-3xl font-display font-bold tracking-tight">
            ₦{(financials.totalPlatformVolume / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm font-bold text-brand-text-muted mt-1">Total Transaction Volume</div>
        </div>
        <div className="pt-5 border-t border-gray-800 flex justify-between">
          <div>
            <div className="text-xl font-display font-bold text-emerald-400">₦{financials.totalPlatformRevenue.toLocaleString()}</div>
            <div className={LABEL}>Platform Cut (5%)</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-display font-bold text-amber-400">₦{financials.escrowCurrentlyHeld.toLocaleString()}</div>
            <div className={LABEL}>Funds Held</div>
          </div>
        </div>
      </div>
    </div>
  );
}

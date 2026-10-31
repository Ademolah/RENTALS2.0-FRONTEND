import { Loader2 } from 'lucide-react';
import { NetworkCard, InventoryCard, FinancialCard } from './OverviewCards';

export default function OverviewTab({ loading, stats }) {
  return (
    <div className="animate-in fade-in">
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-text-muted" /></div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <NetworkCard users={stats.users} />
          <InventoryCard assets={stats.assets} />
          <FinancialCard financials={stats.financials} />
        </div>
      ) : (
        <div className="text-brand-text-secondary font-bold">No stats available.</div>
      )}
    </div>
  );
}

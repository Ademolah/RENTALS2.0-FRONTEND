import { Plus, Landmark, BarChart3, Hash } from 'lucide-react';
import { Button, CityBackdrop } from '../../ui';

export default function EarningsHero({ released, pending, onAddAsset, onPayoutAccount, onAnalytics, onEnterCode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-dark text-white mb-8 p-8 md:p-10 shadow-elevated">
      <CityBackdrop seed="host-earnings" />
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Released to your bank</p>
          <p className="text-5xl md:text-6xl font-display font-bold tracking-tight mt-2 leading-tight">₦{released.toLocaleString()}</p>
          <p className="text-base text-white/70 mt-2">After the 5% platform commission.</p>
        </div>
        <div className="lg:text-right">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Pending payout</p>
          <p className="text-3xl md:text-4xl font-display font-bold mt-1">₦{pending.toLocaleString()}</p>
          <p className="text-base text-white/70 mt-1">Released once check-in is confirmed.</p>
        </div>
      </div>
      <div className="relative mt-8 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onAddAsset}><Plus className="w-5 h-5" /> Add asset</Button>
        <Button variant="outline" onClick={onPayoutAccount}><Landmark className="w-5 h-5" /> Payout account</Button>
        <Button variant="outline" onClick={onAnalytics}><BarChart3 className="w-5 h-5" /> Analytics</Button>
        <Button variant="outline" onClick={onEnterCode}><Hash className="w-5 h-5" /> Enter booking code</Button>
      </div>
    </section>
  );
}

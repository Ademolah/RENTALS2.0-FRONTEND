import { Crown } from 'lucide-react';
import { CityBackdrop } from './ui';

export function VipSectionHeader() {
  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl bg-brand-dark text-white px-6 py-12 md:px-14 md:py-20 shadow-elevated">
      <CityBackdrop image="/lagos.jpg" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-amber-400 text-sm font-bold uppercase tracking-[0.2em]">
          <Crown className="w-4 h-4" />
          <span>VIP Concierge</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-5 leading-[1.05]">
          Curated Nightlife & <br className="hidden md:block" />
          Premium Dining.
        </h1>

        <p className="text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mb-8">
          Secure tables at the most exclusive lounges, clubs, and fine dining establishments. Rentals Africa guarantees your reservation and protects your deposit.
        </p>

        <div className="flex items-center text-sm font-bold bg-white/10 w-fit px-5 py-2.5 rounded-full backdrop-blur-sm border border-white/10">
          <span className="tracking-wide">Lagos & Abuja Only</span>
        </div>
      </div>
    </div>
  );
}

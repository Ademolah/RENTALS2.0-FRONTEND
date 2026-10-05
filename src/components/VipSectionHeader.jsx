import { Sparkles, Crown } from 'lucide-react';

export function VipSectionHeader() {
  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl bg-gray-900 text-white px-6 py-10 md:px-12 md:py-16 shadow-2xl">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10 max-w-2xl">
        
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
          Curated Nightlife & <br className="hidden md:block" />
          Premium Dining.
        </h1>
        
        <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed max-w-lg mb-8">
          Secure tables at the most exclusive lounges, clubs, and fine dining establishments. Platform escrow guarantees your reservation and protects your deposit.
        </p>
        
        <div className="flex items-center space-x-2 text-xs font-bold bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
          <span className="tracking-wide">Lagos & Abuja Only</span>
        </div>
      </div>
    </div>
  );
}
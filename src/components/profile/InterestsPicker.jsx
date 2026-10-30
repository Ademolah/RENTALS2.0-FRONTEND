import { BedDouble, CarFront, Home, KeyRound, CheckCircle2, Circle } from 'lucide-react';

const LOOKING = [
  { id: 'stays', title: 'Hotel & Shortlet Stays', icon: BedDouble },
  { id: 'cars', title: 'Car Rental & Airport Transport', icon: CarFront },
];

const OFFERING = [
  { id: 'host', title: 'Host a Shortlet', icon: Home },
  { id: 'vehicles', title: 'List Cars or Mobility Services', icon: KeyRound },
];

function Option({ title, icon: Icon, on, onClick }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
        on ? 'border-brand-primary bg-brand-accent-soft' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${on ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-dark'}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="flex-1 text-base font-semibold text-brand-dark">{title}</span>
      {on ? <CheckCircle2 className="w-6 h-6 text-brand-primary" /> : <Circle className="w-6 h-6 text-gray-300" />}
    </button>
  );
}

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export default function InterestsPicker({ value, onChange }) {
  const lookingFor = value?.lookingFor || [];
  const offering = value?.offering || [];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">I am looking for</p>
      <div className="space-y-3 mb-6">
        {LOOKING.map((o) => (
          <Option key={o.id} {...o} on={lookingFor.includes(o.id)} onClick={() => onChange({ lookingFor: toggle(lookingFor, o.id), offering })} />
        ))}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">I want to list my service</p>
      <div className="space-y-3">
        {OFFERING.map((o) => (
          <Option key={o.id} {...o} on={offering.includes(o.id)} onClick={() => onChange({ lookingFor, offering: toggle(offering, o.id) })} />
        ))}
      </div>
    </div>
  );
}

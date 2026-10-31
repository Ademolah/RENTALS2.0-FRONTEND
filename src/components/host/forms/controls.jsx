import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { CHIP_STYLES } from './chipStyles';

// --- Error box (three existing looks) ---
export function ErrorAlert({ message, variant = 'studio' }) {
  if (!message) return null;
  if (variant === 'compact') {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <span>{message}</span>
      </div>
    );
  }
  if (variant === 'inline') {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" /> {message}
      </div>
    );
  }
  return (
    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-start space-x-3">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

// --- On/off switch ---
const SWITCH_SIZES = {
  lg: { track: 'w-14 h-8', knob: 'w-6 h-6' },
  sm: { track: 'w-12 h-6', knob: 'w-4 h-4' },
};

export function Switch({ on, onClick, size = 'lg', typed = true }) {
  const s = SWITCH_SIZES[size];
  return (
    <button
      {...(typed ? { type: 'button' } : {})}
      onClick={onClick}
      className={`${s.track} rounded-full transition-colors relative ${on ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <div className={`${s.knob} bg-white rounded-full absolute top-1 transition-transform shadow-sm ${on ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );
}

// "Active Listing" row shared by the shortlet, car and hotel editors.
export function ActiveListingRow({ on, onToggle }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-5 rounded-xl">
      <div>
        <h4 className="font-bold text-gray-900 text-sm">Active Listing</h4>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Toggle off to hide from marketplace</p>
      </div>
      <Switch on={on} onClick={onToggle} />
    </div>
  );
}

// --- Selectable pills ---

// `children` render after the chips inside the same wrapper (e.g. custom, removable pills).
export function ChipGroup({ style, items, selected, onToggle, labelOf = (x) => x, wrapClass, children }) {
  const s = CHIP_STYLES[style];
  return (
    <div className={wrapClass ?? s.wrap}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          className={`${s.chip} ${selected.includes(item) ? s.on : s.off}`}
        >
          {labelOf(item)}
        </button>
      ))}
      {children}
    </div>
  );
}

// --- Icon tiles for hotel amenities ---
const TILE = {
  create: {
    typed: false,
    tile: 'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all overflow-hidden',
    on: 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-[inset_0_0_0_1px_rgba(var(--brand-primary),0.2)]',
    off: 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50',
    icon: (sel) => `w-6 h-6 mb-2 ${sel ? 'text-brand-primary' : 'text-gray-400'}`,
    label: 'text-xs font-bold uppercase tracking-wider text-center',
  },
  edit: {
    typed: true,
    tile: 'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
    on: 'border-brand-primary bg-brand-primary/5 text-brand-primary',
    off: 'border-gray-200 bg-white text-gray-500',
    icon: () => 'w-5 h-5 mb-2',
    label: 'text-xs font-bold uppercase tracking-wider',
  },
};

export function AmenityTiles({ variant, options, selected, onToggle, gridClass }) {
  const t = TILE[variant];
  return (
    <div className={gridClass}>
      {options.map(({ name, icon: Icon }) => {
        const isSelected = selected.includes(name);
        return (
          <button
            {...(t.typed ? { type: 'button' } : {})}
            key={name}
            onClick={() => onToggle(name)}
            className={`${t.tile} ${isSelected ? t.on : t.off}`}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 bg-brand-primary text-white rounded-full p-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
            <Icon className={t.icon(isSelected)} />
            <span className={t.label}>{name}</span>
          </button>
        );
      })}
    </div>
  );
}

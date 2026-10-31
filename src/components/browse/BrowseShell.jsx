import { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Minus, Plus, ArrowUpDown, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { CITIES, MAX_PRICE, SORT_OPTIONS, filterChips, removeChip, naira } from './meta';

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`px-4 py-2 rounded-full text-base font-medium border transition-colors ${
        selected ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-brand-text border-gray-200 hover:border-brand-dark'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text-secondary mb-4">{title}</h3>
      {children}
    </div>
  );
}

function PriceSection({ filters, onChange, max = MAX_PRICE, step = 50000, label }) {
  return (
    <Section title={label}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[['minPrice', 'Min'], ['maxPrice', 'Max']].map(([key, name]) => (
          <label key={key} className="block">
            <span className="text-sm text-brand-text-secondary">{name} (₦)</span>
            <input
              type="number"
              min="0"
              step={step}
              value={filters[key] ?? ''}
              onChange={(e) => onChange({ ...filters, [key]: e.target.value ? Number(e.target.value) : undefined })}
              placeholder={key === 'minPrice' ? '0' : 'Any'}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base text-brand-text focus:outline-none focus:border-brand-dark"
            />
          </label>
        ))}
      </div>
      <input
        type="range"
        min="0"
        max={max}
        step={step}
        value={filters.maxPrice ?? max}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange({ ...filters, maxPrice: v >= max ? undefined : v });
        }}
        aria-label="Maximum price"
        className="w-full accent-brand-dark"
      />
      <p className="text-sm text-brand-text-muted mt-2">Up to {filters.maxPrice ? naira(filters.maxPrice) : `${naira(max)}+`}</p>
    </Section>
  );
}

function Stepper({ label, value = 0, max = 10, onChange }) {
  return (
    <Section title={label}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-dark disabled:opacity-40"
          disabled={value <= 0}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-lg font-semibold w-16 text-center">{value ? `${value}+` : 'Any'}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-dark disabled:opacity-40"
          disabled={value >= max}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </Section>
  );
}

function FilterBody({ config, filters, setFilters }) {
  const set = (patch) => setFilters({ ...filters, ...patch });
  const toggleIn = (key, v) => {
    const list = filters[key] || [];
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    set({ [key]: next.length ? next : undefined });
  };
  return (
    <div>
      {config.map((s) => {
        if (s.kind === 'city') {
          return (
            <Section key="city" title="City">
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <Chip key={c} selected={filters.city === c} onClick={() => set({ city: filters.city === c ? undefined : c })}>{c}</Chip>
                ))}
              </div>
            </Section>
          );
        }
        if (s.kind === 'price') {
          return <PriceSection key="price" label={s.label} max={s.max} step={s.step} filters={filters} onChange={setFilters} />;
        }
        if (s.kind === 'stepper') {
          return <Stepper key={s.key} label={s.label} max={s.max} value={filters[s.key]} onChange={(v) => set({ [s.key]: v || undefined })} />;
        }
        if (s.kind === 'rating') {
          return (
            <Section key="rating" title="Guest rating">
              <div className="flex flex-wrap gap-2">
                {[3, 4, 4.5].map((r) => (
                  <Chip key={r} selected={filters.minRating === r} onClick={() => set({ minRating: filters.minRating === r ? undefined : r })}>{r}+ stars</Chip>
                ))}
              </div>
            </Section>
          );
        }
        if (s.kind === 'multi') {
          return (
            <Section key={s.key} title={s.label}>
              <div className="flex flex-wrap gap-2">
                {s.options.map((o) => (
                  <Chip key={o.value} selected={(filters[s.key] || []).includes(o.value)} onClick={() => toggleIn(s.key, o.value)}>{o.label}</Chip>
                ))}
              </div>
            </Section>
          );
        }
        if (s.kind === 'single') {
          return (
            <Section key={s.key} title={s.label}>
              <div className="flex flex-wrap gap-2">
                {s.options.map((o) => (
                  <Chip key={o.value} selected={filters[s.key] === o.value} onClick={() => set({ [s.key]: filters[s.key] === o.value ? undefined : o.value })}>{o.label}</Chip>
                ))}
              </div>
            </Section>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function BrowseShell({
  config,
  filters,
  setFilters,
  sort,
  setSort,
  total,
  noun = 'results',
  chipLabels,
  baseFilters,
  view,
  setView,
  children,
}) {
  const [open, setOpen] = useState(false);
  const base = baseFilters || {};
  const userFilters = Object.fromEntries(Object.entries(filters).filter(([k, v]) => !(k in base && base[k] === v)));
  const chips = filterChips(userFilters, chipLabels);
  const hasFilters = chips.length > 0;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const clear = () => setFilters({ ...base });

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-[220px] max-h-[calc(100vh-240px)] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xl font-display font-bold text-brand-dark">Filters</h2>
            {hasFilters && <button onClick={clear} className="text-base font-semibold text-brand-primary hover:underline">Clear all</button>}
          </div>
          <FilterBody config={config} filters={filters} setFilters={setFilters} />
        </div>
      </aside>

      <div className="min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="text-base text-brand-text-secondary">
            <span className="font-bold text-brand-dark">{total}</span> {total === 1 ? noun.replace(/s$/, '') : noun}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 max-w-full">
            {setView && (
              <div role="group" aria-label="View" className="inline-flex rounded-xl border border-gray-200 p-1 bg-white">
                {[['list', 'List', LayoutGrid], ['map', 'Map', MapIcon]].map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={view === key}
                    onClick={() => setView(key)}
                    className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-base font-semibold transition-colors ${
                      view === key ? 'bg-brand-dark text-white' : 'text-brand-text-secondary hover:text-brand-dark'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 text-base font-semibold text-brand-dark hover:border-brand-dark"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters{hasFilters ? ` (${chips.length})` : ''}
            </button>
            <label className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 text-base text-brand-dark max-w-full min-w-0">
              <ArrowUpDown className="w-4 h-4 text-brand-text-muted" />
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent font-semibold focus:outline-none cursor-pointer min-w-0 max-w-[9.5rem] sm:max-w-none truncate">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {chips.map((c) => (
              <button
                key={`${c.key}-${c.value || c.label}`}
                onClick={() => setFilters(removeChip(filters, c))}
                className="inline-flex items-center gap-1.5 pl-4 pr-3 py-1.5 rounded-full bg-brand-accent-soft text-brand-dark text-base font-medium hover:bg-gray-200"
              >
                {c.label} <X className="w-4 h-4" />
              </button>
            ))}
            <button onClick={clear} className="text-base font-semibold text-brand-primary px-2 hover:underline">Clear all</button>
          </div>
        )}

        {children}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[100000] flex">
          <div className="absolute inset-0 bg-brand-dark/50" onClick={() => setOpen(false)} />
          <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col animate-fade-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-display font-bold text-brand-dark">Filters</h2>
              <button onClick={() => setOpen(false)} aria-label="Close filters" className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <FilterBody config={config} filters={filters} setFilters={setFilters} />
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={clear} className="flex-1 py-3 rounded-xl border border-gray-200 text-base font-semibold text-brand-dark">Clear all</button>
              <button onClick={() => setOpen(false)} className="flex-[1.6] py-3 rounded-xl bg-brand-primary text-white text-base font-semibold hover:bg-brand-hover">
                Show {total} {total === 1 ? noun.replace(/s$/, '') : noun}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

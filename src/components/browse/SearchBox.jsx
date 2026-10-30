import { useEffect, useRef, useState } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '../../lib/recentSearches';
import { useToast } from '../Toast';

export default function SearchBox({ value = '', onChange, placeholder = 'Search shortlets, hotels, cars...' }) {
  const toast = useToast();
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(getRecentSearches);
  const wrapRef = useRef(null);

  useEffect(() => { setText(value); }, [value]);

  useEffect(() => {
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const run = (term) => {
    const t = String(term || '').trim();
    setText(t);
    setOpen(false);
    onChange(t || undefined);
    if (t) setRecent(addRecentSearch(t));
  };

  const clearAll = () => {
    setRecent(clearRecentSearches());
    toast.info('Recent searches cleared');
  };

  return (
    <div ref={wrapRef} className="relative mb-6">
      <form onSubmit={(e) => { e.preventDefault(); run(text); }} role="search" className="relative">
        <Search className="w-5 h-5 text-brand-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Search listings"
          className="w-full pl-12 pr-28 py-4 text-base rounded-2xl border border-gray-200 bg-white shadow-soft focus:outline-none focus:border-brand-dark focus:shadow-card"
        />
        {text && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => run('')}
            className="absolute right-24 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-brand-text-muted hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-base font-semibold hover:bg-brand-hover">
          Search
        </button>
      </form>

      {open && recent.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-elevated p-3">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-bold uppercase tracking-wider text-brand-text-secondary">Recent searches</span>
            <button type="button" onClick={clearAll} className="text-base font-semibold text-brand-primary hover:underline">Clear</button>
          </div>
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => run(term)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-base text-brand-dark hover:bg-gray-50"
            >
              <Clock className="w-4 h-4 text-brand-text-muted shrink-0" />
              <span className="truncate">{term}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

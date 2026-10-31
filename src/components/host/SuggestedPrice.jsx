import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { fetchSuggestedPrice } from './hostApi';

// Typical nightly rate of similar live listings, so a host can price with confidence.
export default function SuggestedPrice({ category, state, area, bedrooms, onUse }) {
  // The last finished lookup, tagged with the inputs it answered. Loading is derived from it.
  const [lookup, setLookup] = useState({ key: null, result: null });
  const key = JSON.stringify([category, state, area, bedrooms]);
  const loading = !!state && lookup.key !== key;
  const result = state && lookup.key === key ? lookup.result : null;

  useEffect(() => {
    if (!state) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      fetchSuggestedPrice({ category, state, area, bedrooms })
        .then((r) => active && setLookup({ key, result: r }))
        .catch(() => active && setLookup({ key, result: null }));
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [category, state, area, bedrooms, key]);

  if (!state) {
    return <p className="text-sm text-gray-500 flex items-center gap-2 mt-4"><Sparkles className="w-4 h-4" /> Choose a location to see a suggested price.</p>;
  }
  if (loading) return <p className="text-sm text-gray-500 mt-4">Checking similar listings...</p>;
  if (!result?.price) {
    return <p className="text-sm text-gray-500 flex items-center gap-2 mt-4"><Sparkles className="w-4 h-4" /> Not enough similar listings in {area || state} yet to suggest a price.</p>;
  }
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
      <p className="text-base text-amber-900 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
        <span>Similar listings in <strong>{result.scope}</strong> go for about <strong>₦{result.price.toLocaleString()}</strong> a night ({result.count} compared).</span>
      </p>
      <button type="button" onClick={() => onUse(result.price)} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700">
        Use this price
      </button>
    </div>
  );
}

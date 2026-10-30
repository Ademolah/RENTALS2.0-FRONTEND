import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { fetchSuggestedPrice } from './hostApi';

// Typical nightly rate of similar live listings, so a host can price with confidence.
export default function SuggestedPrice({ category, state, area, bedrooms, onUse }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) {
      setResult(null);
      return undefined;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchSuggestedPrice({ category, state, area, bedrooms })
        .then((r) => active && setResult(r))
        .catch(() => active && setResult(null))
        .finally(() => active && setLoading(false));
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [category, state, area, bedrooms]);

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

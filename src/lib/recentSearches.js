const KEY = 'rentals_recent_searches';
const MAX = 6;

export function getRecentSearches() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term) {
  const t = String(term || '').trim();
  if (t.length < 2) return getRecentSearches();
  const next = [t, ...getRecentSearches().filter((s) => s.toLowerCase() !== t.toLowerCase())].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  return [];
}

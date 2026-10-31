// The server sometimes stores amenity and feature lists as broken arrays, e.g.
// ['["Armored"', '"Chauffeur Included"', '"Wi-Fi"]'] or ['[wifi, swimming pool]'].
// cleanList always returns a tidy array of plain strings.
export function cleanList(value) {
  if (value == null) return [];
  const parts = Array.isArray(value) ? value : [value];
  const messy = parts.some((p) => typeof p === 'string' && /[[\]"]|,/.test(p));
  const flat = messy ? parts.join(',').split(',') : parts;
  const seen = new Set();
  return flat
    .map((p) => String(p).replace(/^[\s[\]"']+|[\s[\]"']+$/g, '').trim())
    .filter((p) => {
      const key = p.toLowerCase();
      if (!p || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

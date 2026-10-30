import { toLocalISO } from './dates';

export const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toLocalISO(d);
};

export const daysBetween = (a, b) =>
  Math.max(1, Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000));

export const formatShort = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });

const overlaps = (s, e, booked) =>
  (booked || []).some((b) => {
    const bs = String(b.startDate || b.start || '').slice(0, 10);
    const be = String(b.endDate || b.end || '').slice(0, 10);
    return bs && be && s < be && e > bs;
  });

/**
 * Up to `max` free windows of the same length after the chosen start.
 * Uses the listing's bookedDates when present, otherwise asks the server via `isFree`.
 */
export async function findNearbyWindows({ start, end, bookedDates, isFree, max = 4, horizon = 45 }) {
  const len = daysBetween(start, end);
  const today = toLocalISO(new Date());
  const found = [];
  for (let off = 1; off <= horizon && found.length < max; off += 8) {
    const batch = [];
    for (let i = off; i < off + 8 && i <= horizon; i++) {
      const s = addDays(start, i);
      if (s < today) continue;
      const e = addDays(s, len);
      if (bookedDates && overlaps(s, e, bookedDates)) continue;
      batch.push({ start: s, end: e });
    }
    if (!bookedDates && isFree) {
      const results = await Promise.all(batch.map((w) => isFree(w.start, w.end).catch(() => false)));
      batch.forEach((w, i) => results[i] && found.push(w));
    } else {
      found.push(...batch);
    }
  }
  const out = [];
  let last = '';
  for (const w of found) {
    if (last && w.start < addDays(last, 0)) continue;
    out.push(w);
    last = w.end;
    if (out.length >= max) break;
  }
  return out;
}

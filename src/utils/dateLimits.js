// Centralizes how far ahead a guest may book, reserve, or search.
// Rolling 2-year window: from Nov 2026 the furthest selectable date is Nov 2028 — 2029 is out of range.
export const MAX_BOOKING_YEARS_AHEAD = 2;

export function getMaxBookableDate(from = new Date()) {
  const max = new Date(from.getFullYear() + MAX_BOOKING_YEARS_AHEAD, from.getMonth(), from.getDate());
  max.setHours(23, 59, 59, 999);
  return max;
}

// True once a calendar's visible month can no longer move forward and stay in range,
// so the "next month" arrow can be disabled the same way the "previous month" arrow
// is already disabled once the view reaches today.
export function isMonthBeyondMax(viewDate, maxDate) {
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const maxMonthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  return monthStart >= maxMonthStart;
}

// Converts a local midnight Date (as built by `new Date(year, month, day)`) to a
// 'YYYY-MM-DD' string without drifting a day in timezones ahead of UTC (e.g. Lagos,
// UTC+1), where plain `.toISOString()` rolls local midnight back to the previous day.
export function toLocalDateStr(date) {
  const offset = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offset.toISOString().split('T')[0];
}

// The backend rejects a stay whose checkout equals its check-in ("Start date must be
// before end date"), so a same-day/day-use stay — which the calendars now allow — is
// sent to the API as a 1-night span (checkout bumped to the next calendar day). The
// guest still sees and is billed for the same-day dates they picked; only the value
// sent over the wire differs.
export function toApiCheckoutDate(checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr || checkInStr !== checkOutStr) return checkOutStr;
  const next = new Date(`${checkOutStr}T00:00:00`);
  next.setDate(next.getDate() + 1);
  return toLocalDateStr(next);
}

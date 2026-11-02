// Client-side helpers for communicating date conflicts clearly to guests, using the
// `bookedDates` array ([{ startDate, endDate, roomTypeId? }]) that listings carry (the
// same field Home.jsx uses to filter out fully-booked listings), plus the `bookedRanges`
// array the availability-check endpoint now returns on a conflict. `endDate` is treated
// as the checkout day — it is NOT occupied, so a new stay may start there.

export function parseLocalDateStr(str) {
  return str ? new Date(`${str}T00:00:00`) : null;
}

function toRanges(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => ({ start: new Date(b.startDate), end: new Date(b.endDate) }))
    .filter((r) => !isNaN(r.start) && !isNaN(r.end));
}

// `roomTypeId`, when passed, keeps only entries tagged for that room (hotels tag each
// booking with the room it belongs to) plus any untagged, listing-wide entries.
export function parseBookedRanges(item, roomTypeId) {
  const raw = item?.bookedDates;
  if (!Array.isArray(raw)) return [];
  const scoped = roomTypeId ? raw.filter((b) => !b.roomTypeId || b.roomTypeId === roomTypeId) : raw;
  return toRanges(scoped);
}

// Parses the `bookedRanges` array returned directly on a failed availability check —
// this is the live, authoritative conflict data for the exact stay just queried.
export function parseApiBookedRanges(raw) {
  return toRanges(raw);
}

// True if `date` falls on an occupied night (start inclusive, end exclusive).
export function isDateBooked(date, bookedRanges) {
  return bookedRanges.some((r) => date >= r.start && date < r.end);
}

// True if the half-open stay [startDate, endDate) overlaps any booked range.
export function rangeOverlapsBooking(startDate, endDate, bookedRanges) {
  if (!startDate || !endDate) return false;
  return bookedRanges.some((r) => r.start < endDate && r.end > startDate);
}

// Walks forward from `fromDate` past any booked range it lands in, returning the
// first free date (capped at maxDate). Used to tell a guest exactly where to look next.
export function findNextAvailableDate(fromDate, bookedRanges, maxDate) {
  let candidate = new Date(fromDate);
  for (let i = 0; i < 730; i++) {
    const blocking = bookedRanges.find((r) => r.start <= candidate && candidate < r.end);
    if (!blocking) return maxDate && candidate > maxDate ? null : candidate;
    candidate = new Date(blocking.end);
  }
  return null;
}

export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Builds the "X is already booked, next available date is Y" message guests asked for.
// Returns null when there's no concrete "pick from X" answer to give (either no local
// booked-range data covers the requested date, or it's already the earliest free day) —
// callers should fall back to a plain, still-accurate message in that case.
export function buildConflictMessage(requestedDate, bookedRanges, maxBookableDate) {
  const nextAvailable = findNextAvailableDate(requestedDate, bookedRanges, maxBookableDate);
  if (!nextAvailable || nextAvailable.getTime() <= requestedDate.getTime()) {
    return null;
  }
  return `${formatShortDate(requestedDate)} is already booked. The next available date is ${formatShortDate(nextAvailable)} — please choose from there.`;
}

const GENERIC_DATE_CONFLICT_MESSAGE = 'These dates are already booked. Please choose different dates.';

// Picks the right guest-facing message for an "unavailable" result from the backend.
// A host-level pause (the listing's own `isAvailable` flag, already used elsewhere in
// this codebase) is the only case where the backend's raw `message` is shown as-is;
// otherwise this is a date conflict, and the specific "pick from X" wording (built from
// the live `bookedRanges` the availability endpoint now returns) always wins when it can
// be computed, falling back to the backend's own (now-accurate) message, then a generic one.
export function describeUnavailable({ isListingPaused, backendMessage, requestedDate, bookedRanges, maxBookableDate }) {
  if (isListingPaused) {
    return backendMessage || 'This listing is currently paused by the host and not accepting bookings.';
  }
  return buildConflictMessage(requestedDate, bookedRanges, maxBookableDate) || backendMessage || GENERIC_DATE_CONFLICT_MESSAGE;
}

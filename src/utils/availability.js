// Client-side helpers for communicating date conflicts clearly to guests, using the
// `bookedDates` array ([{ startDate, endDate, roomTypeId? }]) that listings carry (the
// same field Home.jsx uses to filter out fully-booked listings), plus the `bookedRanges`
// array the availability-check endpoint now returns on a conflict.
//
// The backend's dates carry an actual check-in/check-out TIME (e.g. 14:00 / 10:00), not
// just a calendar day. Comparing full timestamps against a grid cell's local midnight is
// wrong in either direction depending on timezone, so every comparison here is done at
// calendar-day granularity only (time stripped) — and the whole span from check-in to
// check-out is treated as occupied, INCLUSIVE of the checkout day itself: nobody else can
// start a stay on a day that's already someone's check-in, mid-stay night, or checkout day.

export function parseLocalDateStr(str) {
  return str ? new Date(`${str}T00:00:00`) : null;
}

// Strips the time component, returning local midnight for that calendar day.
function toCalendarDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toRanges(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      return { start, end };
    })
    .filter((r) => !isNaN(r.start) && !isNaN(r.end))
    .map((r) => ({ start: toCalendarDay(r.start), end: toCalendarDay(r.end) }));
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

// True if `date` falls anywhere within a booked stay, check-in day through checkout day,
// both inclusive.
export function isDateBooked(date, bookedRanges) {
  const day = toCalendarDay(date);
  return bookedRanges.some((r) => day >= r.start && day <= r.end);
}

// True if the candidate stay [startDate, endDate] (both inclusive) touches any booked
// range (also both inclusive) on any calendar day.
export function rangeOverlapsBooking(startDate, endDate, bookedRanges) {
  if (!startDate || !endDate) return false;
  const start = toCalendarDay(startDate);
  const end = toCalendarDay(endDate);
  return bookedRanges.some((r) => r.start <= end && r.end >= start);
}

// Walks forward from `fromDate` past any booked range it lands in, returning the first
// free calendar day after it (capped at maxDate). Used to tell a guest exactly where to
// look next — since the checkout day itself is occupied, the next free day is the one
// right after it.
export function findNextAvailableDate(fromDate, bookedRanges, maxDate) {
  let candidate = toCalendarDay(fromDate);
  for (let i = 0; i < 730; i++) {
    const blocking = bookedRanges.find((r) => r.start <= candidate && candidate <= r.end);
    if (!blocking) return maxDate && candidate > maxDate ? null : candidate;
    candidate = new Date(blocking.end.getFullYear(), blocking.end.getMonth(), blocking.end.getDate() + 1);
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
  if (!nextAvailable || nextAvailable.getTime() <= toCalendarDay(requestedDate).getTime()) {
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

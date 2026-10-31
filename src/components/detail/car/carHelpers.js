export const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80';

export const CONCIERGE_TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
];

export const DURATION_OPTIONS = [
  { value: 1, label: '12 Hours (Half Day)' },
  { value: 2, label: '24 Hours (Full Day)' },
  { value: 4, label: '48 Hours (2 Days)' },
  { value: 6, label: '72 Hours (3 Days)' },
  { value: 14, label: '1 Week (14 x 12hr blocks)' },
];

const to24 = (t) => {
  const m = /(\d+):(\d+)\s*(AM|PM)?/i.exec(t || '10:00 AM') || ['', '10', '00'];
  let h = Number(m[1]);
  if (m[3]) {
    const pm = m[3].toUpperCase() === 'PM';
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};

// A rental is a number of 12-hour blocks starting at the chosen Lagos time.
export const slotRange = (date, time, slots) => {
  const start = new Date(`${date}T${to24(time)}:00+01:00`);
  return { start, end: new Date(start.getTime() + slots * 12 * 3600000) };
};

export const lagosIso = (d) => new Date(d.getTime() + 3600000).toISOString().slice(0, 19) + '+01:00';

export const carTitle = (car) => `${car.make} ${car.carModel || car.model || ''} ${car.year || ''}`.trim();

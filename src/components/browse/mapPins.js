// Same neighbourhood centres the mobile app uses, so a listing sits in the same place on both.
const AREAS = {
  lagos: [6.4541, 3.3947], 'victoria island': [6.4281, 3.4219], ikoyi: [6.4549, 3.4347], lekki: [6.4474, 3.4723], 'lekki phase 1': [6.4474, 3.4723],
  ajah: [6.4698, 3.5852], ikeja: [6.6018, 3.3515], 'ikeja gra': [6.5833, 3.3553], yaba: [6.5095, 3.3711], surulere: [6.5006, 3.3581], maryland: [6.5714, 3.3672],
  gbagada: [6.5536, 3.3912], magodo: [6.6204, 3.3816], festac: [6.4667, 3.2833], apapa: [6.4488, 3.3594], 'banana island': [6.4667, 3.45], oniru: [6.4311, 3.4447],
  'eko atlantic': [6.4089, 3.4067], sangotedo: [6.4664, 3.6302], chevron: [6.4398, 3.5289], ogudu: [6.5746, 3.3929], ilupeju: [6.5536, 3.3567],
  abuja: [9.0579, 7.4951], maitama: [9.0882, 7.4934], asokoro: [9.0421, 7.5263], wuse: [9.0765, 7.4726], 'wuse 2': [9.0796, 7.4767], garki: [9.0333, 7.4833],
  utako: [9.066, 7.438], jabi: [9.0667, 7.425], gwarinpa: [9.1099, 7.4042], 'central business district': [9.0543, 7.4892], katampe: [9.1286, 7.461],
  'life camp': [9.0827, 7.4012], lugbe: [8.9797, 7.3736], kubwa: [9.1547, 7.322], guzape: [9.0166, 7.508], apo: [8.9881, 7.4881], durumi: [9.0204, 7.4682],
};

const num = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

export function pinFor(item) {
  const a = item.address || item.location || {};
  const id = String(item._id || item.id || '');
  const c = a.coordinates || {};
  const lat = num(c.lat) ?? num(c.latitude);
  const lng = num(c.lng) ?? num(c.longitude);
  if (lat !== undefined && lng !== undefined && (lat !== 0 || lng !== 0)) return { lat, lng, approximate: false };

  const city = String(a.city || '').trim().toLowerCase();
  const state = String(a.state || '').trim().toLowerCase();
  const centre = AREAS[city] || AREAS[state] || (/abuja|fct|federal/.test(state) ? AREAS.abuja : /lagos/.test(state) ? AREAS.lagos : undefined);
  if (!centre) return null;

  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return {
    lat: centre[0] + ((h % 200) - 100) / 20000,
    lng: centre[1] + ((Math.floor(h / 200) % 200) - 100) / 20000,
    approximate: true,
  };
}

export const shortPrice = (raw) => {
  const p = Number(raw) || 0;
  if (p >= 1000000) return `₦${(p / 1000000).toFixed(1)}M`;
  if (p >= 1000) return `₦${Math.round(p / 1000)}k`;
  return `₦${p}`;
};

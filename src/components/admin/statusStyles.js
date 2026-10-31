import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const GRAY = 'bg-gray-100 text-gray-600 border border-gray-200';
const AMBER = 'bg-amber-50 text-amber-600 border border-amber-200';
const EMERALD = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
const RED = 'bg-red-50 text-red-600 border border-red-200';

// Colour and icon for host applications and listings.
export function listingStatusStyle(status) {
  if (status === 'APPROVED') return { className: EMERALD, Icon: CheckCircle2 };
  if (status === 'PENDING') return { className: AMBER, Icon: Clock };
  if (status === 'REJECTED') return { className: RED, Icon: XCircle };
  return { className: GRAY, Icon: CheckCircle2 };
}

// Colour and icon for payment ledger rows.
export function ledgerStatusStyle(status) {
  if (status === 'HELD' || status === 'HELD_IN_ESCROW') return { className: AMBER, Icon: Clock };
  if (status === 'RELEASED' || status === 'RELEASED_TO_LANDLORD') return { className: EMERALD, Icon: CheckCircle2 };
  return { className: GRAY, Icon: Clock };
}

// Raw server statuses can mention "escrow". People never see that word.
export const ledgerStatusLabel = (status) => status.replace(/_?IN_?ESCROW/i, '').replace(/_/g, ' ');

export const errMsg = (error, fallback) => error?.response?.data?.message || fallback;

export const personName = (person, fallback = '') =>
  person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || fallback : fallback;

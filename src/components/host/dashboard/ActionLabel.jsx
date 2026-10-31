import { Loader2 } from 'lucide-react';
import { actionLabel } from './constants';

// The confirm-button text for a booking type, or a spinner while it is being processed.
export default function ActionLabel({ type, processing }) {
  if (processing) return <Loader2 className="w-4 h-4 animate-spin mx-auto" />;
  return actionLabel(type);
}

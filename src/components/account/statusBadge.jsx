import { Badge } from '../ui';

export function statusBadge(b) {
  if (b.cancelled) return <Badge tone="gray">Cancelled</Badge>;
  if (b.released || b.completed) return <Badge tone="green">Completed</Badge>;
  if (!b.paid) return <Badge tone="amber">Awaiting payment</Badge>;
  if (b.guestConfirmed) return <Badge tone="dark">Checked in</Badge>;
  return <Badge tone="green">Confirmed</Badge>;
}

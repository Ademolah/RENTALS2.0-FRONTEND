import { LayoutDashboard, Users, Building, Wallet, Settings, ListChecks, MessageSquare } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
  { id: 'concierge', label: 'Concierge Queue', icon: MessageSquare },
  { id: 'applications', label: 'Host Applications', icon: Users },
  { id: 'pending-assets', label: 'Pending Listings', icon: ListChecks },
  { id: 'assets', label: 'Asset Oversight', icon: Building },
  { id: 'escrow', label: 'Payment Ledger', icon: Wallet },
  { id: 'settings', label: 'Platform Settings', icon: Settings },
];

// The "escrow" tab id is internal. People only ever see "payment ledger".
export const tabHeading = (tabId) => (tabId === 'escrow' ? 'payment ledger' : tabId.replace('-', ' '));

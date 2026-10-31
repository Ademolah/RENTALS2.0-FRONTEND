import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPage } from '../test/helpers';

vi.mock('../api/admin', () => ({
  getHostApplications: vi.fn(),
  approveHostApplication: vi.fn(),
  rejectHostApplication: vi.fn(),
  getDashboardStats: vi.fn(),
  getEscrowLedger: vi.fn(),
  getAssetOversight: vi.fn(),
  toggleAssetStatus: vi.fn(),
  updateAssetApprovalStatus: vi.fn(),
  getPendingConciergeDrafts: vi.fn(),
  generateConciergeCheckoutUrl: vi.fn(),
}));

import * as admin from '../api/admin';
import AdminDashboard from './AdminDashboard';

const applications = [
  { _id: 'a1', user: { firstName: 'Ada', lastName: 'Host' }, nin: '12345678901', city: 'Ikeja', state: 'Lagos', status: 'PENDING' },
];
const stats = {
  users: { totalUsers: 120, totalHosts: 30, pendingHosts: 4 },
  assets: { totalShortlets: 10, totalHotels: 3, totalVip: 2, totalCars: 5, pendingAssets: 2 },
  financials: { totalPlatformVolume: 5400000, totalPlatformRevenue: 270000, escrowCurrentlyHeld: 900000 },
};
const ledger = [
  { _id: 'l1', createdAt: '2026-10-01T10:00:00Z', userId: { firstName: 'Tobi', lastName: 'Guest' }, propertyId: { title: 'Lekki Penthouse' }, totalAmount: 250000, escrowStatus: 'HELD_IN_ESCROW' },
  { _id: 'l2', createdAt: '2026-10-02T10:00:00Z', userId: { firstName: 'Ife', lastName: 'Visitor' }, carId: { make: 'Toyota', model: 'Camry' }, totalAmount: 90000, payoutStatus: 'RELEASED_TO_LANDLORD' },
];
const assetData = {
  properties: [
    { _id: 'p1', title: 'Ikoyi Loft', category: 'SHORTLET', status: 'APPROVED', isVerified: false, isAvailable: true, createdAt: '2026-09-01T00:00:00Z' },
    { _id: 'p2', title: 'Wuse Flat', category: 'SHORTLET', status: 'PENDING', isVerified: false, isAvailable: true, createdAt: '2026-10-05T00:00:00Z', description: 'Nice flat', pricePerNight: 50000, images: ['https://img.test/1.jpg'], ownerId: { firstName: 'Bayo', lastName: 'Owner' } },
  ],
  cars: [
    { _id: 'c1', make: 'Mercedes', carModel: 'S-Class', status: 'APPROVED', isVerified: true, isAvailable: false, createdAt: '2026-09-02T00:00:00Z' },
  ],
};
const drafts = [
  { _id: 'd1', paystackReference: 'WA-ABC123', userId: { firstName: 'Chi', lastName: 'Guest' }, propertyId: { title: 'Maitama Villa' } },
];

const goTo = (name) => userEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  vi.clearAllMocks();
  admin.getHostApplications.mockResolvedValue({ data: { requests: applications } });
  admin.getDashboardStats.mockResolvedValue({ data: stats });
  admin.getEscrowLedger.mockResolvedValue({ data: { ledger } });
  admin.getAssetOversight.mockResolvedValue({ data: assetData });
  admin.getPendingConciergeDrafts.mockResolvedValue({ data: { data: { drafts } } });
  admin.generateConciergeCheckoutUrl.mockResolvedValue({ data: { data: { checkoutUrl: 'https://pay.example/xyz' } } });
  admin.approveHostApplication.mockResolvedValue({});
  admin.rejectHostApplication.mockResolvedValue({});
  admin.toggleAssetStatus.mockResolvedValue({});
  admin.updateAssetApprovalStatus.mockResolvedValue({});
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
});

describe('AdminDashboard', () => {
  it('opens on host applications and lists the applicant', async () => {
    renderPage(<AdminDashboard />);
    expect(await screen.findByText('Ada Host')).toBeInTheDocument();
    expect(screen.getByText('12345678901')).toBeInTheDocument();
    expect(screen.getByText('Ikeja, Lagos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/applications/i);
  });

  it('approves a host application and removes it from the list', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await userEvent.click(screen.getByRole('button', { name: /Review/ }));
    expect(screen.getByText('Application Review')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Approve Host/ }));
    await waitFor(() => expect(admin.approveHostApplication).toHaveBeenCalledWith('a1'));
    await waitFor(() => expect(screen.queryByText('Ada Host')).not.toBeInTheDocument());
    expect(screen.getByText('No pending host applications.')).toBeInTheDocument();
  });

  it('rejects a host application with the standard reason', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await userEvent.click(screen.getByRole('button', { name: /Review/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Reject$/ }));
    await waitFor(() => expect(admin.rejectHostApplication).toHaveBeenCalledWith('a1', 'Failed internal verification'));
  });

  it('shows the server message in an alert when approval fails', async () => {
    admin.approveHostApplication.mockRejectedValue({ response: { data: { message: 'Nope, server says no' } } });
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await userEvent.click(screen.getByRole('button', { name: /Review/ }));
    await userEvent.click(screen.getByRole('button', { name: /Approve Host/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nope, server says no');
    expect(screen.getByText('Application Review')).toBeInTheDocument();
  });

  it('falls back to a clear message when the applications list cannot load', async () => {
    admin.getHostApplications.mockRejectedValue(new Error('network'));
    renderPage(<AdminDashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load host applications.');
  });

  it('shows the sidebar badge count for applications', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    expect(screen.getByRole('button', { name: /Host Applications/ })).toHaveTextContent('1');
  });

  it('platform overview shows network, inventory and financial cards', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Platform Overview/);
    expect(await screen.findByText('Total Registered Users')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Verified Hosts')).toBeInTheDocument();
    expect(screen.getByText('Shortlets')).toBeInTheDocument();
    expect(screen.getByText('2 Assets Pending Review')).toBeInTheDocument();
    expect(screen.getByText('₦5.4M')).toBeInTheDocument();
    expect(screen.getByText('Platform Cut (5%)')).toBeInTheDocument();
    expect(screen.getByText('Funds Held')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/escrow/i);
  });

  it('overview reports a stats failure', async () => {
    admin.getDashboardStats.mockRejectedValue(new Error('x'));
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Platform Overview/);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load platform stats.');
    expect(screen.getByText('No stats available.')).toBeInTheDocument();
  });

  it('payment ledger uses payment wording and never shows the word escrow', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Payment Ledger/);
    expect(await screen.findByText('Tobi Guest')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/payment ledger/i);
    expect(screen.getByText('Payout Status')).toBeInTheDocument();
    expect(screen.getByText('Lekki Penthouse')).toBeInTheDocument();
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('₦250,000')).toBeInTheDocument();
    expect(screen.getByText('HELD')).toBeInTheDocument();
    expect(screen.getByText('RELEASED TO LANDLORD')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/escrow/i);
  });

  it('payment ledger shows an empty state', async () => {
    admin.getEscrowLedger.mockResolvedValue({ data: { ledger: [] } });
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Payment Ledger/);
    expect(await screen.findByText('No payment records found.')).toBeInTheDocument();
  });

  it('asset oversight lists properties and cars and toggles verification', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Asset Oversight/);
    expect(await screen.findByText('Ikoyi Loft')).toBeInTheDocument();
    expect(screen.getByText('Mercedes S-Class')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Unverified' })[0]);
    await waitFor(() => expect(admin.toggleAssetStatus).toHaveBeenCalledWith('PROPERTY', 'p1', { isVerified: true }));
    await waitFor(() => expect(screen.queryAllByRole('button', { name: 'Unverified' }).length).toBe(1));
  });

  it('asset oversight toggles visibility for a car', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Asset Oversight/);
    await screen.findByText('Mercedes S-Class');
    await userEvent.click(screen.getByRole('button', { name: 'Hidden' }));
    await waitFor(() => expect(admin.toggleAssetStatus).toHaveBeenCalledWith('CAR', 'c1', { isAvailable: true }));
  });

  it('pending listings can be reviewed and approved to the live feed', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Pending Listings/);
    expect(await screen.findByText('Wuse Flat')).toBeInTheDocument();
    expect(screen.getByText('Bayo Owner')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Review Quality/ }));
    expect(screen.getByText('Review Listing Quality')).toBeInTheDocument();
    expect(screen.getByText('Nice flat')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Approve to Live Feed/ }));
    await waitFor(() => expect(admin.updateAssetApprovalStatus).toHaveBeenCalledWith('PROPERTY', 'p2', 'APPROVED'));
    await waitFor(() => expect(screen.queryByText('Review Listing Quality')).not.toBeInTheDocument());
    expect(screen.getByText('No pending asset listings to review.')).toBeInTheDocument();
  });

  it('pending listing review opens the media viewer and rejects quality', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Pending Listings/);
    await userEvent.click(await screen.findByRole('button', { name: /Review Quality/ }));
    await userEvent.click(screen.getByAltText('Listing 0'));
    expect(screen.getByAltText('Enlarged inspection')).toBeInTheDocument();
    const closers = screen.getAllByRole('button', { name: 'Close' });
    await userEvent.click(closers[closers.length - 1]);
    expect(screen.queryByAltText('Enlarged inspection')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Reject Quality/ }));
    await waitFor(() => expect(admin.updateAssetApprovalStatus).toHaveBeenCalledWith('PROPERTY', 'p2', 'REJECTED'));
  });

  it('concierge queue generates a payment link from a negotiated price', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Concierge Queue/);
    expect(await screen.findByText('WA-ABC123')).toBeInTheDocument();
    expect(screen.getByText('Chi Guest')).toBeInTheDocument();
    expect(screen.getByText('Maitama Villa')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('e.g. 450000'), '450000');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await waitFor(() => expect(admin.generateConciergeCheckoutUrl).toHaveBeenCalledWith({ referenceCode: 'WA-ABC123', finalAmount: '450000' }));
    expect(await screen.findByDisplayValue('https://pay.example/xyz')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Copy$/ }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://pay.example/xyz');
    expect(await screen.findByRole('alert')).toHaveTextContent('Payment link copied. Paste it to the guest on WhatsApp.');
  });

  it('concierge queue asks for a price before generating', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Concierge Queue/);
    await userEvent.click(await screen.findByRole('button', { name: /Generate/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid negotiated price.');
    expect(admin.generateConciergeCheckoutUrl).not.toHaveBeenCalled();
  });

  it('concierge queue copies the reference code', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Concierge Queue/);
    await userEvent.click(await screen.findByTitle('Copy Reference Code'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('WA-ABC123');
    expect(await screen.findByRole('alert')).toHaveTextContent('Reference WA-ABC123 copied.');
  });

  it('platform settings shows the commission rules', async () => {
    renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    await goTo(/Platform Settings/);
    expect(screen.getByText('Platform rules')).toBeInTheDocument();
    expect(screen.getByText(/host receives 95%/)).toBeInTheDocument();
    expect(screen.getByText(/N25,000 per 12 hours/)).toBeInTheDocument();
  });

  it('mobile menu button toggles the sidebar overlay', async () => {
    const { container } = renderPage(<AdminDashboard />);
    await screen.findByText('Ada Host');
    expect(container.querySelector('.bg-black\\/50')).toBeNull();
    const toggles = container.querySelectorAll('div.md\\:hidden button');
    await userEvent.click(toggles[0]);
    expect(container.querySelector('.bg-black\\/50')).not.toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import { renderPage } from '../test/helpers';

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
const todayIso = `${today}T12:00:00.000Z`;

const listings = [
  { id: 'p-live', type: 'SHORTLET', title: 'Lekki Loft', location: 'Lagos', image: 'x.jpg', price: 120000, status: 'active', raw: {} },
  { id: 'p-wait', type: 'SHORTLET', title: 'Ikoyi Penthouse', location: 'Lagos', image: 'x.jpg', price: 300000, status: 'pending', local: true, raw: {} },
  { id: 'h-live', type: 'HOTEL', title: 'Grand Hotel', location: 'Abuja', image: 'x.jpg', price: 80000, status: 'active', raw: {} },
  { id: 'c-paused', type: 'CAR', title: 'Toyota Camry 2022', location: 'Lagos', image: 'x.jpg', price: 60000, status: 'paused', raw: { isAvailable: false } },
  { id: 'v-wait', type: 'VIP', title: 'The Velvet Room', location: 'Lagos', image: 'x.jpg', price: 1500000, status: 'pending', raw: {} },
];

const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
const futureHotelBooking = {
  _id: 'hotel0000def456',
  paymentStatus: 'SUCCESS',
  reservationStatus: 'CONFIRMED',
  escrowStatus: 'HELD',
  totalAmount: 200000,
  checkInDate: `${tomorrow}T12:00:00.000Z`,
  checkOutDate: `${tomorrow}T14:00:00.000Z`,
  createdAt: '2026-01-01T00:00:00.000Z',
  userId: { firstName: 'SecretGuest', lastName: 'Person', phoneNumber: '08011112222' },
  propertyId: { _id: 'h-live', title: 'Grand Hotel', category: 'HOTEL', address: { city: 'Abuja', state: 'FCT' }, images: [] },
};

const propertyBooking = {
  _id: 'booking000abc123',
  paymentStatus: 'SUCCESS',
  reservationStatus: 'CONFIRMED',
  escrowStatus: 'HELD',
  totalAmount: 100000,
  checkInDate: todayIso,
  checkOutDate: todayIso,
  createdAt: todayIso,
  userId: { firstName: 'SecretGuest', lastName: 'Person', phoneNumber: '08011112222' },
  propertyId: { _id: 'p-live', title: 'Lekki Loft', category: 'SHORTLET', address: { city: 'Lagos', state: 'Lagos' }, images: [] },
};

vi.mock('../api/host', () => ({
  HostService: {
    getAnalytics: vi.fn().mockResolvedValue({
      data: {
        year: 2026,
        summary: { totalEarnings: 950000, pendingPayouts: 95000, completedPayouts: 855000, totalBookings: 7 },
        chartData: [{ month: 3, totalEarnings: 400000, bookings: 3 }],
      },
    }),
    cancelReservation: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../api/properties', () => ({
  getLandlordPropertyBookings: vi.fn(),
  confirmPropertyCheckIn: vi.fn().mockResolvedValue({}),
  getPropertyById: vi.fn().mockResolvedValue({ data: { property: {} } }),
  updateProperty: vi.fn().mockResolvedValue({}),
}));
vi.mock('../api/car', () => ({
  getLandlordCarBookings: vi.fn().mockResolvedValue({ data: { bookings: [] } }),
  confirmCarHandover: vi.fn().mockResolvedValue({}),
  getCarById: vi.fn().mockResolvedValue({ data: { car: {} } }),
  updateCar: vi.fn().mockResolvedValue({}),
}));
vi.mock('../api/hotel', () => ({
  getLandlordHotelBookings: vi.fn().mockResolvedValue({ data: { bookings: [] } }),
  confirmHotelCheckIn: vi.fn().mockResolvedValue({}),
  getHotelById: vi.fn().mockResolvedValue({ data: { hotel: {} } }),
  updateHotel: vi.fn().mockResolvedValue({}),
}));
vi.mock('../api/vip', () => ({
  confirmVipArrival: vi.fn().mockResolvedValue({}),
  getVipEstablishmentById: vi.fn().mockResolvedValue({ data: { establishment: {} } }),
  updateVipEstablishment: vi.fn().mockResolvedValue({}),
}));

vi.mock('../components/host/hostApi', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    fetchMyListings: vi.fn(),
    fetchHostReviews: vi.fn(),
    setListingAvailable: vi.fn().mockResolvedValue({}),
    rememberSubmitted: vi.fn(),
  };
});

vi.mock('../context/AuthContext', async () => {
  const { authValue } = await import('../test/helpers');
  return { useAuth: () => authValue() };
});

vi.mock('../components/PayoutActionCard', () => ({
  default: ({ booking }) => <div data-testid="payout-card">Payout for {booking._id}</div>,
}));
['BankSetupModal', 'AddPropertyModal', 'AddCarModal', 'CreateHotelModal', 'AddVipModal', 'EditVipModal', 'EditCarModal', 'EditPropertyModal', 'EditHotelModal'].forEach((name) => {
  vi.doMock(`../components/${name}`, () => ({ default: () => null }));
});

import * as hostApi from '../components/host/hostApi';
import { getLandlordPropertyBookings, confirmPropertyCheckIn } from '../api/properties';
import { HostService } from '../api/host';
import { getLandlordHotelBookings } from '../api/hotel';
import LandlordDashboard from './LandlordDashboard';

async function renderDashboard() {
  renderPage(<LandlordDashboard />);
  await screen.findByText('Portfolio');
  await waitFor(() => expect(screen.queryByRole('status', { hidden: true })).toBeNull());
}

const goTab = async (label) => {
  const nav = screen.getByRole('button', { name: label });
  fireEvent.click(nav);
};

beforeEach(() => {
  localStorage.setItem('rentals_token', 'x');
  hostApi.fetchMyListings.mockResolvedValue({ items: listings, failed: 0 });
  hostApi.fetchHostReviews.mockResolvedValue([
    { id: 'r1', listing: 'Lekki Loft', rating: 4.5, comment: 'Lovely place', createdAt: new Date('2026-05-01') },
  ]);
  getLandlordPropertyBookings.mockResolvedValue({ data: { bookings: [propertyBooking] } });
  getLandlordHotelBookings.mockResolvedValue({ data: { bookings: [futureHotelBooking] } });
});

describe('LandlordDashboard', () => {
  it('shows the waiting-for-approval banner and listing counts', async () => {
    await renderDashboard();
    expect(await screen.findByText('2 listings are waiting for admin approval')).toBeInTheDocument();
    const tileValue = (label) => screen.getByText(label).parentElement.querySelector('h3').textContent;
    expect(tileValue('Your listings')).toBe('5');
    expect(tileValue('Waiting for approval')).toBe('2');
    expect(tileValue('Approved')).toBe('3');
  });

  it('shows the earnings hero with the 95% payout and arriving-today actions', async () => {
    await renderDashboard();
    expect(await screen.findByText('Released to your bank')).toBeInTheDocument();
    // 95% of 100,000 + 200,000 is pending
    expect(screen.getAllByText('₦285,000').length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Arriving today')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Booking #ABC123').length).toBeGreaterThan(0);
  });

  it('ledger shows the booking reference and never guest details', async () => {
    await renderDashboard();
    await screen.findAllByText('Ledger & Actions');
    expect(screen.getAllByText('#ABC123').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Managed by Rentals Africa').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/SecretGuest|08011112222|Person/);
    expect(screen.getAllByText('Confirm Checkin').length).toBeGreaterThan(0);
  });

  it('shows approval badges and notes on the shortlets tab', async () => {
    await renderDashboard();
    await goTab('My Shortlets');
    expect(await screen.findByText('Lekki Loft')).toBeInTheDocument();
    const waiting = screen.getAllByText('Waiting for admin approval');
    expect(waiting.length).toBeGreaterThan(0);
    expect(screen.getByText(/goes live and becomes visible to guests/)).toBeInTheDocument();
    // pending local listing has no View as guest / Edit
    const pendingCard = screen.getByText('Ikoyi Penthouse').closest('.group');
    expect(within(pendingCard).queryByText('View as guest')).toBeNull();
    expect(within(pendingCard).queryByText('Edit')).toBeNull();
    // approved one has both
    const liveCard = screen.getByText('Lekki Loft').closest('.group');
    expect(within(liveCard).getByText('Approved')).toBeInTheDocument();
    expect(within(liveCard).getByText('View as guest')).toBeInTheDocument();
    expect(within(liveCard).getByText('Edit')).toBeInTheDocument();
  });

  it('shows paused state and the make-available action on the cars tab', async () => {
    await renderDashboard();
    await goTab('My Cars');
    expect(await screen.findByText('Toyota Camry 2022')).toBeInTheDocument();
    expect(screen.getByText('Approved, unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Make available'));
    await waitFor(() => expect(hostApi.setListingAvailable).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Mark unavailable')).toBeInTheDocument();
  });

  it('lists hotels and VIP assets on their tabs', async () => {
    await renderDashboard();
    await goTab('My Hotels');
    expect(await screen.findByText('Grand Hotel')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    await goTab('VIP Assets');
    expect(await screen.findByText('The Velvet Room')).toBeInTheDocument();
    expect(screen.getByText('Waiting for admin approval')).toBeInTheDocument();
  });

  it('shows the bookings table without guest details', async () => {
    await renderDashboard();
    await goTab('Bookings');
    const table = await screen.findByRole('table');
    expect(within(table).getByText('#ABC123')).toBeInTheDocument();
    expect(within(table).getByText('#DEF456')).toBeInTheDocument();
    expect(within(table).getByText('Lekki Loft')).toBeInTheDocument();
    expect(within(table).getByText('Cancel')).toBeInTheDocument();
    expect(table.textContent).not.toMatch(/SecretGuest|08011112222/);
  });

  it('shows the payouts tab with a payout card per paid booking', async () => {
    await renderDashboard();
    await goTab('Payouts');
    const cards = await screen.findAllByTestId('payout-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent(/booking000abc123|hotel0000def456/);
  });

  it('loads the earnings tab from analytics', async () => {
    await renderDashboard();
    await goTab('Earnings');
    expect(await screen.findByText('Total earnings')).toBeInTheDocument();
    expect(screen.getByText('₦950,000')).toBeInTheDocument();
    expect(screen.getByText('Monthly earnings')).toBeInTheDocument();
  });

  it('loads the reviews tab without reviewer identity', async () => {
    await renderDashboard();
    await goTab('Reviews');
    expect(await screen.findByText('Lovely place')).toBeInTheDocument();
    expect(screen.getByText(/Verified guest/)).toBeInTheDocument();
  });

  it('opens the Add Asset menu with every asset type', async () => {
    await renderDashboard();
    fireEvent.click(screen.getAllByRole('button', { name: /Add Asset/i })[0]);
    expect(await screen.findByText('Apartment • Shortlet')).toBeInTheDocument();
    expect(screen.getByText('Rental • Chauffeur')).toBeInTheDocument();
    expect(screen.getByText('Boutique • Resort')).toBeInTheDocument();
    expect(screen.getByText('Venue • Service • Security')).toBeInTheDocument();
  });

  it('finds a booking by its code and asks for confirmation', async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /Enter booking code/i }));
    const input = await screen.findByLabelText('#A1B2C3');
    fireEvent.change(input, { target: { value: '#abc123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find booking' }));
    expect(await screen.findByText('Booking #ABC123 at Lekki Loft.')).toBeInTheDocument();
  });

  it('confirms an arrival from the ledger and then waits for the guest', async () => {
    await renderDashboard();
    await screen.findAllByText('Ledger & Actions');
    const buttons = await screen.findAllByRole('button', { name: 'Confirm Checkin' });
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(confirmPropertyCheckIn).toHaveBeenCalledWith('booking000abc123'));
    expect((await screen.findAllByText('Awaiting Client')).length).toBeGreaterThan(0);
  });

  it('cancels a future reservation after confirmation', async () => {
    await renderDashboard();
    await goTab('Bookings');
    const table = await screen.findByRole('table');
    fireEvent.click(within(table).getByText('Cancel'));
    expect(await screen.findByText('Cancel this reservation?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel reservation' }));
    await waitFor(() => expect(HostService.cancelReservation).toHaveBeenCalledWith('hotel0000def456'));
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
  });
});

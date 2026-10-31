import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { guestUser } from '../test/helpers';

let currentUser = null;
vi.mock('../context/AuthContext', async () => {
  const { authValue } = await import('../test/helpers');
  return { useAuth: () => authValue(currentUser) };
});
vi.mock('../components/Toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() }) }));
vi.mock('../components/InteractiveMap', () => ({ default: () => <div>MAP</div> }));
vi.mock('../components/detail/ReviewsSection', () => ({ default: () => <div>REVIEWS</div> }));
vi.mock('../api/user', () => ({ toggleFavoriteApi: vi.fn(), getUnreadCountApi: vi.fn().mockResolvedValue(0) }));
vi.mock('../api/reviews', () => ({ createPropertyReviewApi: vi.fn() }));
vi.mock('../api/reservation', () => ({ logUnifiedWhatsappIntent: vi.fn(), saveCheckoutDraft: vi.fn() }));
vi.mock('../api/properties', () => ({
  getPropertyById: vi.fn().mockResolvedValue({
    data: { property: {
      _id: 'p1', propertyId: '1234', title: 'Lekki Penthouse', address: { street: '1 Admiralty Way', city: 'Lekki', state: 'Lagos' },
      pricePerNight: 150000, description: 'A lovely place', maxGuests: 4, bedrooms: 2, bathrooms: 2, category: 'SHORTLET',
      images: ['a.jpg', 'b.jpg'], amenities: ['WiFi'], ownerId: 'someone-else', status: 'APPROVED', bookedDates: [],
    } },
  }),
  getProperties: vi.fn().mockResolvedValue({ data: { properties: [] } }),
  checkPropertyAvailability: vi.fn().mockResolvedValue({ available: true }),
}));
vi.mock('../api/vip', () => ({
  getVipEstablishmentById: vi.fn().mockResolvedValue({
    data: { data: { establishment: {
      _id: 'v1', title: 'The Velvet Room', description: 'Lounge', depositAmount: 1500000, images: ['a.jpg', 'b.jpg'],
      address: { street: '2 Bar Beach', city: 'Lagos', state: 'Lagos' }, openHours: { open: '18:00', close: '04:00', daysOpen: ['FRIDAY'] },
      services: [], establishmentType: 'LOUNGE', ownerId: 'someone-else',
    } } },
  }),
  initiateVipReservation: vi.fn(),
}));

import PropertyDetail from './PropertyDetail';
import VipDetails from './VipDetails';

const renderAt = (path, route, element) =>
  render(<MemoryRouter initialEntries={[route]}><Routes><Route path={path} element={element} /></Routes></MemoryRouter>);

beforeEach(() => { currentUser = null; localStorage.clear(); });

describe('PropertyDetail', () => {
  it('shows the listing with the website booking and WhatsApp checkout', async () => {
    renderAt('/property/:id', '/property/p1', <PropertyDetail />);
    await waitFor(() => expect(screen.getAllByText('Lekki Penthouse').length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Check out via WhatsApp/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Managed by Rentals Africa/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/currently unavailable/i)).toBeNull();
    expect(screen.queryByText(/platform fee/i)).toBeNull();
  });

  it('shows the cancellation note without naming the payment processor', async () => {
    renderAt('/property/:id', '/property/p1', <PropertyDetail />);
    await waitFor(() => expect(screen.getAllByText('Lekki Penthouse').length).toBeGreaterThan(0));
    expect(document.body.textContent).toMatch(/Payment processing fees are non-refundable/);
    expect(document.body.textContent).not.toMatch(/paystack|escrow/i);
  });

  it('works for a signed-in guest too', async () => {
    currentUser = guestUser;
    renderAt('/property/:id', '/property/p1', <PropertyDetail />);
    await waitFor(() => expect(screen.getAllByText('Lekki Penthouse').length).toBeGreaterThan(0));
  });
});

describe('VipDetails', () => {
  it('shows the venue with the deposit and WhatsApp checkout', async () => {
    renderAt('/vip/:id', '/vip/v1', <VipDetails />);
    await waitFor(() => expect(screen.getAllByText('The Velvet Room').length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Check out via WhatsApp/).length).toBeGreaterThan(0);
    expect(document.body.textContent).toMatch(/Managed by Rentals Africa/);
    expect(document.body.textContent).not.toMatch(/paystack|escrow|platform fee/i);
  });
});

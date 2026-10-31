import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderPage, guestUser } from '../test/helpers';

let currentUser = null;
vi.mock('../context/AuthContext', async () => {
  const { authValue } = await import('../test/helpers');
  return { useAuth: () => authValue(currentUser) };
});
const { listing } = vi.hoisted(() => ({
  listing: (id, title, price, city = 'Lagos') => ({
    _id: id, title, pricePerNight: price, address: { city, state: 'Lagos', street: 'Street' }, images: ['a.jpg'], isVerified: true, rating: 4.5, numReviews: 2, category: 'SHORTLET', capacity: { guests: 4, bedrooms: 2 },
  }),
}));
vi.mock('../api/properties', () => ({
  getProperties: vi.fn().mockResolvedValue({ data: { properties: [listing('p1', 'Lekki Penthouse', 150000), listing('p2', 'Ikoyi Studio', 90000), listing('p3', 'VI Loft', 200000)] } }),
}));
vi.mock('../api/car', () => ({ getCars: vi.fn().mockResolvedValue({ data: { cars: [] } }) }));
vi.mock('../api/trips', () => ({ fetchGuestBookings: vi.fn().mockResolvedValue([]) }));
vi.mock('../api/user', () => ({ toggleFavoriteApi: vi.fn(), getUnreadCountApi: vi.fn().mockResolvedValue(0) }));
vi.mock('../components/HotelCard', () => ({ default: () => <div>HOTEL-VIEW</div> }));
vi.mock('../components/VipListingView', () => ({ default: () => <div>VIP-VIEW</div> }));
vi.mock('../components/browse/ListingsMap', () => ({ default: () => <div>MAP-VIEW</div> }));

import Home from './Home';

beforeEach(() => { currentUser = null; sessionStorage.clear(); localStorage.clear(); });

describe('Home', () => {
  it('shows the hero, category cards and the WhatsApp notice', async () => {
    renderPage(<Home />);
    expect(screen.getByText('Stay Somewhere Exceptional')).toBeInTheDocument();
    for (const n of ['Shortlets', 'Hotels', 'Car Rentals', 'VIP']) expect(screen.getAllByText(n).length).toBeGreaterThan(0);
    expect(screen.getByText(/check out via WhatsApp/i)).toBeInTheDocument();
  });

  it('lists the loaded shortlets with their price and type tag', async () => {
    renderPage(<Home />);
    await waitFor(() => expect(screen.getByText('Lekki Penthouse')).toBeInTheDocument());
    expect(screen.getByText('Ikoyi Studio')).toBeInTheDocument();
    expect(screen.getAllByText(/Shortlet/i).length).toBeGreaterThan(0);
  });

  it('category cards switch the tab', async () => {
    const onCategoryChange = vi.fn();
    renderPage(<Home onCategoryChange={onCategoryChange} />);
    fireEvent.click(screen.getAllByRole('button', { pressed: false }).find((b) => b.textContent.includes('Car Rentals')));
    expect(onCategoryChange).toHaveBeenCalledWith('car');
  });

  it('renders the hotel and VIP views for those tabs', () => {
    const { unmount } = renderPage(<Home activeCategory="hotel" />);
    expect(screen.getByText('HOTEL-VIEW')).toBeInTheDocument();
    unmount();
    renderPage(<Home activeCategory="vip" />);
    expect(screen.getByText('VIP-VIEW')).toBeInTheDocument();
  });

  it('toggles to the map view', async () => {
    renderPage(<Home />);
    await waitFor(() => expect(screen.getByText('Lekki Penthouse')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Map/ }));
    expect(screen.getByText('MAP-VIEW')).toBeInTheDocument();
  });

  it('shows Welcome back only when signed in', async () => {
    const { unmount } = renderPage(<Home />);
    expect(screen.queryByText(/Welcome back/)).toBeNull();
    unmount();
    currentUser = guestUser;
    renderPage(<Home />);
    expect(screen.getByText('Welcome back, Tobi')).toBeInTheDocument();
  });
});

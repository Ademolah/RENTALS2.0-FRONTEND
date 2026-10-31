import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const state = vi.hoisted(() => ({ user: null, setShowAuthModal: null, toast: null }));

vi.mock('../api/hotel', () => ({
  getHotelById: vi.fn(),
  checkHotelRoomAvailability: vi.fn(),
}));
vi.mock('../api/reservation', () => ({
  logUnifiedWhatsappIntent: vi.fn(),
}));
vi.mock('../api/reviews', () => ({
  createPropertyReviewApi: vi.fn(),
  getListingReviews: vi.fn().mockResolvedValue({ items: [], summary: { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } }),
}));
vi.mock('../components/InteractiveMap', () => ({ default: () => <div data-testid="map" /> }));
vi.mock('../components/BookModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="book-modal" /> : null),
}));
vi.mock('../components/Toast', () => ({ useToast: () => state.toast }));
vi.mock('../context/AuthContext', async () => {
  const { authValue } = await import('../test/helpers');
  return { useAuth: () => authValue(state.user, { setShowAuthModal: state.setShowAuthModal }) };
});

import { getHotelById, checkHotelRoomAvailability } from '../api/hotel';
import { guestUser } from '../test/helpers';
import HotelDetails from './HotelDetails';

const hotel = {
  _id: 'h1',
  title: 'Grand Lagos Hotel',
  description: 'A calm hotel near the water.',
  address: { street: '1 Marina Road', city: 'Lagos', state: 'Lagos' },
  images: ['h1.jpg', 'h2.jpg'],
  amenities: ['WiFi', 'Swimming pool'],
  startingPrice: 80000,
  rating: 4.5,
  reviewsCount: 2,
  checkInTime: '14:00',
  checkOutTime: '11:00',
  status: 'APPROVED',
  roomTypes: [
    { _id: 'r1', name: 'Deluxe Suite', pricePerNight: 80000, capacity: { adults: 2 }, amenities: ['WiFi'] },
  ],
};

const renderHotel = () =>
  render(
    <MemoryRouter initialEntries={['/hotel/h1']}>
      <Routes>
        <Route path="/hotel/:id" element={<HotelDetails />} />
      </Routes>
    </MemoryRouter>
  );

const enabledDays = () =>
  screen.getAllByRole('button').filter((b) => /^\d{1,2}$/.test(b.textContent.trim()) && !b.disabled);

// Picks three nights in next month so the test does not depend on today's date.
async function pickThreeNights(user) {
  await user.click(screen.getByText('Check-In'));
  const nexts = screen.getAllByRole('button', { name: 'Next' });
  await user.click(nexts[nexts.length - 1]);
  const first = enabledDays();
  await user.click(first[4]);
  const second = enabledDays();
  await user.click(second[second.length - 1] && second.find((b) => Number(b.textContent) === Number(first[4].textContent) + 3));
}

beforeEach(() => {
  state.user = null;
  state.setShowAuthModal = vi.fn();
  state.toast = { show: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn() };
  localStorage.clear();
  getHotelById.mockResolvedValue({ data: { hotel } });
  checkHotelRoomAvailability.mockResolvedValue({ data: { available: true } });
});

describe('HotelDetails page', () => {
  it('renders the hotel for a signed-out visitor', async () => {
    const { container } = renderHotel();
    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Grand Lagos Hotel');
    expect(screen.getByText('Managed by Rentals Africa')).toBeInTheDocument();
    expect(screen.getByText('About this hotel')).toBeInTheDocument();
    expect(screen.queryByText('About this property')).not.toBeInTheDocument();
    expect(screen.getAllByText('Deluxe Suite').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText(/Grand Lagos Hotel - view/).length).toBe(2);
    expect(screen.getAllByText('₦80,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Taxes & fees included|Taxes incl\./).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Payment processing fees are non-refundable/).length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-whatsapp-checkout]').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Check out via WhatsApp').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Login to Reserve' })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/escrow|paystack|platform fee/i);
  });

  it('shows a not-found message when the hotel cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getHotelById.mockRejectedValue(new Error('network'));
    renderHotel();
    expect(await screen.findByText(/Hotel not found or is no longer available/)).toBeInTheDocument();
  });

  it('opens sign-in when a signed-out visitor clicks Reserve', async () => {
    const user = userEvent.setup();
    renderHotel();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('button', { name: 'Login to Reserve' }));
    expect(state.setShowAuthModal).toHaveBeenCalledWith(true);
  });

  it('prices the stay by the number of nights with no extra fee', async () => {
    const user = userEvent.setup();
    renderHotel();
    await screen.findByRole('heading', { level: 1 });
    await pickThreeNights(user);
    expect(await screen.findByText('3 nights in Lagos')).toBeInTheDocument();
    expect(screen.getAllByText('₦240,000').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/platform fee/i);
  });

  it('asks a signed-in guest for dates before reserving, then opens the booking dialog', async () => {
    const user = userEvent.setup();
    state.user = guestUser;
    renderHotel();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('button', { name: 'Reserve Now' }));
    expect(state.toast.show).toHaveBeenCalledWith('Please select your check-in and check-out dates.');
    await pickThreeNights(user);
    await user.click(screen.getByRole('button', { name: 'Reserve Now' }));
    expect(await screen.findByTestId('book-modal')).toBeInTheDocument();
  });

  it('tells the guest the dates are booked when WhatsApp checkout finds no room', async () => {
    const user = userEvent.setup();
    state.user = guestUser;
    checkHotelRoomAvailability.mockResolvedValue({ data: { available: false } });
    const { container } = renderHotel();
    await screen.findByRole('heading', { level: 1 });
    await pickThreeNights(user);
    const block = container.querySelector('[data-whatsapp-checkout]');
    await user.click(within(block).getByRole('button', { name: /Check out via WhatsApp/ }));
    await vi.waitFor(() =>
      expect(state.toast.show).toHaveBeenCalledWith(expect.stringMatching(/These dates have been booked/))
    );
  });
});

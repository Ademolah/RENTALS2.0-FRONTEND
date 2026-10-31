import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const state = vi.hoisted(() => ({ user: null }));

vi.mock('../api/car', () => ({
  getCarById: vi.fn(),
  checkCarAvailability: vi.fn(),
  getCars: vi.fn(),
}));
vi.mock('../api/reservation', () => ({
  logUnifiedWhatsappIntent: vi.fn(),
  saveCheckoutDraft: vi.fn(),
}));
vi.mock('../context/AuthContext', async () => {
  const { authValue } = await import('../test/helpers');
  return { useAuth: () => authValue(state.user) };
});

import { getCarById, checkCarAvailability, getCars } from '../api/car';
import { guestUser } from '../test/helpers';
import CarDetails from './CarDetails';

const car = {
  _id: 'c1',
  make: 'Mercedes',
  model: 'S-Class',
  carModel: 'S-Class',
  year: 2024,
  category: 'Luxury',
  location: { city: 'Lagos', state: 'Lagos' },
  pricePer12Hours: 150000,
  seatNumber: 4,
  transmission: 'automatic',
  description: 'A very comfortable car.',
  images: ['a.jpg', 'b.jpg', 'c.jpg'],
  features: ['Leather seats', 'Bluetooth'],
  bookedDates: [],
  deliveryAvailable: false,
};

const renderCar = () =>
  render(
    <MemoryRouter initialEntries={['/cars/c1']}>
      <Routes>
        <Route path="/cars/:id" element={<CarDetails />} />
      </Routes>
    </MemoryRouter>
  );

const enabledDays = () =>
  screen.getAllByRole('button').filter((b) => /^\d{1,2}$/.test(b.textContent.trim()) && !b.disabled);

async function pickADate(user) {
  await user.click(screen.getByText('Select Date'));
  const days = enabledDays();
  await user.click(days[days.length - 1]);
}

beforeEach(() => {
  state.user = null;
  localStorage.clear();
  getCarById.mockResolvedValue({ data: { car } });
  getCars.mockResolvedValue({ data: { cars: [] } });
  checkCarAvailability.mockResolvedValue({ available: true });
});

describe('CarDetails page', () => {
  it('renders the listing for a signed-out visitor', async () => {
    const { container } = renderCar();
    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Mercedes S-Class');
    expect(screen.getByText('Managed by Rentals Africa')).toBeInTheDocument();
    expect(screen.getAllByAltText(/View|Main View/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₦150,000/).length).toBeGreaterThan(0);
    expect(screen.getByText('About this vehicle')).toBeInTheDocument();
    expect(screen.getByText('Leather seats')).toBeInTheDocument();
    expect(screen.getByText(/Payment processing fees are non-refundable/)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-whatsapp-checkout]')).toHaveLength(1);
    expect(screen.getAllByText('Check out via WhatsApp').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/escrow|paystack|platform fee/i);
  });

  it('adds the N25,000 chauffeur fee to the total without any platform fee', async () => {
    const user = userEvent.setup();
    renderCar();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('₦25,000 / 12 hrs')).toBeInTheDocument();
    await user.click(screen.getByText('Add Chauffeur'));
    expect(await screen.findByText(/Chauffeur Fee/)).toBeInTheDocument();
    expect(screen.getAllByText('₦175,000').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/platform fee/i);
  });

  it('shows the booked notice when the dates are taken', async () => {
    const user = userEvent.setup();
    checkCarAvailability.mockResolvedValue({ available: false });
    renderCar();
    await screen.findByRole('heading', { level: 1 });
    await pickADate(user);
    await user.click(screen.getByRole('button', { name: /^Availability$/ }));
    expect(await screen.findByText('These dates have been booked.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check availability/i })).toBeInTheDocument();
  });

  it('asks a signed-in guest for a date, then for the licence confirmation', async () => {
    const user = userEvent.setup();
    state.user = guestUser;
    renderCar();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('button', { name: 'Reserve Now' }));
    expect(await screen.findByText('Please select a pick-up date.')).toBeInTheDocument();
    await pickADate(user);
    await user.click(screen.getByRole('button', { name: 'Reserve Now' }));
    expect(await screen.findByText('Please confirm you hold a valid driving licence.')).toBeInTheDocument();
  });

  it('shows a not-found message when the car cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getCarById.mockRejectedValue(new Error('network'));
    renderCar();
    expect(await screen.findByText('Vehicle not found')).toBeInTheDocument();
  });

  it('shows the delivery option and fee when the car offers delivery', async () => {
    const user = userEvent.setup();
    getCarById.mockResolvedValue({ data: { car: { ...car, deliveryAvailable: true, deliveryFee: 10000 } } });
    renderCar();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByText('Deliver to me'));
    expect(await screen.findByPlaceholderText('Where should we bring it?')).toBeInTheDocument();
    expect(await screen.findByText('Delivery fee')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('₦160,000').length).toBeGreaterThan(0));
  });
});

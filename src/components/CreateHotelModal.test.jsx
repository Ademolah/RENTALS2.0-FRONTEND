import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockObjectUrls, pngFile, pickFiles, imageInput, formEntries, control, setValue } from '../test/modalKit';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() }));
vi.mock('./Toast', () => ({ useToast: () => toast }));
vi.mock('../api/hotel', () => ({ createHotel: vi.fn() }));
vi.mock('./host/hostApi', () => ({ fetchSuggestedPrice: vi.fn().mockResolvedValue({ price: null, count: 0, scope: '' }) }));

import { createHotel } from '../api/hotel';
import CreateHotelModal from './CreateHotelModal';

let resetUrls;
beforeEach(() => {
  localStorage.clear();
  resetUrls = mockObjectUrls();
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

const goToStep = (n) => { for (let i = 1; i < n; i += 1) fireEvent.click(screen.getByText('Next Step')); };

describe('CreateHotelModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<CreateHotelModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows step 1 of the wizard', () => {
    resetUrls();
    render(<CreateHotelModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Create Hotel Profile')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('moves between steps and snapshots each one', () => {
    resetUrls();
    render(<CreateHotelModal isOpen onClose={vi.fn()} />);
    goToStep(2);
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    goToStep(2);
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Publish Hotel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('closes from the close button', () => {
    const onClose = vi.fn();
    render(<CreateHotelModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('toggles amenities and previews and removes images', () => {
    resetUrls();
    const { container } = render(<CreateHotelModal isOpen onClose={vi.fn()} />);
    goToStep(2);
    fireEvent.click(screen.getByText('Swimming Pool'));
    expect(screen.getByText('Swimming Pool').closest('button').className).toMatch(/border-brand-primary/);
    pickFiles(imageInput(container), [pngFile('a.png'), pngFile('b.png')]);
    expect(screen.getAllByAltText(/Preview/)).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText('Delete')[0]);
    expect(screen.getAllByAltText(/Preview/)).toHaveLength(1);
  });

  it('adds and removes room types', () => {
    const { container } = render(<CreateHotelModal isOpen onClose={vi.fn()} />);
    goToStep(3);
    expect(screen.getByText('1 Room Added')).toBeInTheDocument();
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Add Another Room Type'));
    expect(screen.getByText('2 Rooms Added')).toBeInTheDocument();
    expect(container.querySelectorAll('button[aria-label="Delete"]')).toHaveLength(2);
    fireEvent.click(container.querySelectorAll('button[aria-label="Delete"]')[0]);
    expect(screen.getByText('1 Room Added')).toBeInTheDocument();
  });

  it('publishes the hotel with its rooms and reports the created hotel', async () => {
    createHotel.mockResolvedValue({ data: { hotel: { _id: 'h1' } } });
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { container } = render(<CreateHotelModal isOpen onClose={onClose} onSuccess={onSuccess} />);
    setValue(control(container, 'Hotel Name'), 'Grand Lagos');
    setValue(control(container, 'Description'), 'Five star');
    setValue(screen.getByPlaceholderText('Street Address (e.g. 15 Bourdillon Rd)'), '1 Marina');
    setValue(screen.getByPlaceholderText('City'), 'Lagos Island');
    setValue(container.querySelector('select'), 'Lagos');
    fireEvent.click(container.querySelector('button.rounded-full.relative'));
    goToStep(2);
    fireEvent.click(screen.getByText('Restaurant'));
    pickFiles(imageInput(container), [pngFile('lobby.png')]);
    goToStep(2);
    setValue(screen.getByPlaceholderText('Room Name (e.g. Deluxe King Suite)'), 'Deluxe King');
    setValue(control(container, 'Price / Night'), '85000');
    fireEvent.click(screen.getByText('Publish Hotel'));

    await waitFor(() => expect(createHotel).toHaveBeenCalledTimes(1));
    const e = formEntries(createHotel.mock.calls[0][0]);
    expect(e.title).toEqual(['Grand Lagos']);
    expect(e.hasBreakfast).toEqual(['true']);
    expect(e.category).toEqual(['HOTEL']);
    expect(e.street).toEqual(['1 Marina']);
    expect(e.city).toEqual(['Lagos Island']);
    expect(e.state).toEqual(['Lagos']);
    expect(e.country).toEqual(['Nigeria']);
    expect(JSON.parse(e.amenities[0])).toEqual(['Restaurant']);
    const rooms = JSON.parse(e.roomTypes[0]);
    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toMatchObject({ name: 'Deluxe King', pricePerNight: 85000, totalInventory: 1, capacity: { adults: 2, children: 0 } });
    expect(e.startingPrice).toEqual(['85000']);
    expect(e.images).toEqual(['file:lobby.png']);
    expect(toast.success).toHaveBeenCalledWith('Hotel published. It goes live after approval.');

    await vi.advanceTimersByTimeAsync(2100);
    expect(onSuccess).toHaveBeenCalledWith({ hotel: { _id: 'h1' } });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the server message when publishing fails', async () => {
    createHotel.mockRejectedValue({ response: { data: { message: 'Hotel name taken' } } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CreateHotelModal isOpen onClose={vi.fn()} />);
    goToStep(3);
    fireEvent.click(screen.getByText('Publish Hotel'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Hotel name taken'));
  });

  it('restores a saved draft', () => {
    localStorage.setItem('rentals_draft_hotel', JSON.stringify({ savedAt: Date.now(), values: { form: { title: 'Draft hotel', amenities: ['Restaurant'] }, arrivalNotes: 'Use side gate' } }));
    const { container } = render(<CreateHotelModal isOpen onClose={vi.fn()} />);
    expect(control(container, 'Hotel Name')).toHaveValue('Draft hotel');
    expect(screen.getByText(/Draft saved/)).toBeInTheDocument();
  });
});

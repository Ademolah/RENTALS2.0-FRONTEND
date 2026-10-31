import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockObjectUrls, pngFile, pickFiles, imageInput, formEntries, control, setValue } from '../test/modalKit';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() }));
vi.mock('./Toast', () => ({ useToast: () => toast }));
vi.mock('../api/vip', () => ({ createVipEstablishment: vi.fn(), createVipService: vi.fn() }));

import { createVipEstablishment, createVipService } from '../api/vip';
import AddVipModal from './AddVipModal';

let resetUrls;
beforeEach(() => {
  localStorage.clear();
  resetUrls = mockObjectUrls();
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

const fillVenue = (container) => {
  setValue(control(container, 'Establishment Name'), 'The Velvet Room');
  setValue(control(container, 'Description'), 'Exclusive lounge');
  setValue(control(container, 'Dress Code'), 'Smart');
  setValue(control(container, 'Street Address'), '15 Adetokunbo Ademola');
  setValue(control(container, 'State'), 'Lagos');
  setValue(control(container, 'City / Base'), 'Ikoyi');
};

describe('AddVipModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<AddVipModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the venue form with host-side commission wording', () => {
    resetUrls();
    render(<AddVipModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Create VIP Listing')).toBeInTheDocument();
    expect(screen.getByText('Platform commission (5%)')).toBeInTheDocument();
    expect(screen.getByText('5% commission deducted from your payout')).toBeInTheDocument();
    expect(screen.getByText('Required Deposit')).toBeInTheDocument();
  });

  it('switches to the service form', () => {
    resetUrls();
    render(<AddVipModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('VIP Service'));
    expect(screen.getByText('Daily Rate (NGN)')).toBeInTheDocument();
    expect(screen.getByText('0 / 5 PHOTOS')).toBeInTheDocument();
    expect(screen.queryByText('Dress Code')).not.toBeInTheDocument();
  });

  it('closes from the close button', () => {
    const onClose = vi.fn();
    render(<AddVipModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('validates photos, operating days and a custom category', async () => {
    const { container } = render(<AddVipModal isOpen onClose={vi.fn()} />);
    fillVenue(container);
    fireEvent.submit(container.querySelector('#vip-form'));
    expect(await screen.findByText('Please upload at least one photograph of the listing.')).toBeInTheDocument();

    pickFiles(imageInput(container), [pngFile()]);
    ['Thu', 'Fri', 'Sat', 'Sun'].forEach((d) => fireEvent.click(screen.getByText(d)));
    fireEvent.submit(container.querySelector('#vip-form'));
    expect(await screen.findByText('Please select at least one operating day.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Thu'));
    setValue(control(container, 'Category'), 'OTHER');
    fireEvent.submit(container.querySelector('#vip-form'));
    expect(await screen.findByText('Please specify the custom category.')).toBeInTheDocument();
    expect(createVipEstablishment).not.toHaveBeenCalled();
  });

  it('limits photos to 10 for venues and 5 for services', () => {
    const { container } = render(<AddVipModal isOpen onClose={vi.fn()} />);
    pickFiles(imageInput(container), Array.from({ length: 11 }, (_, i) => pngFile(`p${i}.png`)));
    expect(screen.getByText('Maximum of 10 photos allowed for VIP Venues.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('VIP Service'));
    pickFiles(imageInput(container), Array.from({ length: 6 }, (_, i) => pngFile(`s${i}.png`)));
    expect(screen.getByText('Maximum of 5 photos allowed for VIP Services.')).toBeInTheDocument();
  });

  it('adds a custom inclusion and removes it again', () => {
    render(<AddVipModal isOpen onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Add custom amenity (e.g. Helipad)...');
    setValue(input, 'Helipad');
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Helipad')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Helipad'));
    expect(screen.queryByText('Helipad')).not.toBeInTheDocument();
  });

  it('submits a venue and reports the created establishment', async () => {
    createVipEstablishment.mockResolvedValue({ data: { data: { establishment: { _id: 'v1' } } } });
    const onClose = vi.fn();
    const onEstablishmentAdded = vi.fn();
    const { container } = render(<AddVipModal isOpen onClose={onClose} onEstablishmentAdded={onEstablishmentAdded} />);
    fillVenue(container);
    fireEvent.click(screen.getByText('Bottle Service'));
    pickFiles(imageInput(container), [pngFile('room.png')]);
    fireEvent.submit(container.querySelector('#vip-form'));

    await waitFor(() => expect(createVipEstablishment).toHaveBeenCalledTimes(1));
    const e = formEntries(createVipEstablishment.mock.calls[0][0]);
    expect(e.title).toEqual(['The Velvet Room']);
    expect(e.establishmentType).toEqual(['LOUNGE']);
    expect(e.depositAmount).toEqual(['150000']);
    expect(e.dressCode).toEqual(['Smart']);
    expect(e.street).toEqual(['15 Adetokunbo Ademola']);
    expect(e.city).toEqual(['Ikoyi']);
    expect(e.state).toEqual(['Lagos']);
    expect(e.open).toEqual(['10:00 PM']);
    expect(e.close).toEqual(['04:00 AM']);
    expect(JSON.parse(e.daysOpen[0])).toEqual(['Thursday', 'Friday', 'Saturday', 'Sunday']);
    expect(JSON.parse(e.services[0])).toEqual(['Bottle Service']);
    expect(e.images).toEqual(['file:room.png']);
    expect(toast.success).toHaveBeenCalledWith('Venue published. It goes live after approval.');

    await vi.advanceTimersByTimeAsync(2600);
    expect(onEstablishmentAdded).toHaveBeenCalledWith({ _id: 'v1' });
    expect(onClose).toHaveBeenCalled();
  });

  it('submits a service with a default street', async () => {
    createVipService.mockResolvedValue({ data: { data: { service: { _id: 's1' } } } });
    const onEstablishmentAdded = vi.fn();
    const { container } = render(<AddVipModal isOpen onClose={vi.fn()} onEstablishmentAdded={onEstablishmentAdded} />);
    fireEvent.click(screen.getByText('VIP Service'));
    setValue(control(container, 'Service Title'), 'Elite Escort');
    setValue(control(container, 'Description'), 'Armed escorts');
    setValue(control(container, 'State'), 'Abuja');
    setValue(control(container, 'City / Base'), 'Maitama');
    pickFiles(imageInput(container), [pngFile('team.png')]);
    fireEvent.submit(container.querySelector('#vip-form'));

    await waitFor(() => expect(createVipService).toHaveBeenCalledTimes(1));
    const e = formEntries(createVipService.mock.calls[0][0]);
    expect(e.serviceType).toEqual(['ARMED_ESCORT']);
    expect(e.pricePerDay).toEqual(['150000']);
    expect(e.street).toEqual(['Service Area']);
    expect(e.depositAmount).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith('Service published. It goes live after approval.');
    await vi.advanceTimersByTimeAsync(2600);
    expect(onEstablishmentAdded).toHaveBeenCalledWith({ _id: 's1' });
  });

  it('shows the server message when publishing fails', async () => {
    createVipEstablishment.mockRejectedValue({ response: { data: { message: 'Venue exists' } } });
    const { container } = render(<AddVipModal isOpen onClose={vi.fn()} />);
    fillVenue(container);
    pickFiles(imageInput(container), [pngFile()]);
    fireEvent.submit(container.querySelector('#vip-form'));
    expect(await screen.findByText('Venue exists')).toBeInTheDocument();
  });

  it('restores a saved draft', () => {
    localStorage.setItem('rentals_draft_vip', JSON.stringify({ savedAt: Date.now(), values: { listingCategory: 'VENUE', title: 'Draft venue', dressCode: 'Formal' } }));
    const { container } = render(<AddVipModal isOpen onClose={vi.fn()} />);
    expect(control(container, 'Establishment Name')).toHaveValue('Draft venue');
    expect(control(container, 'Dress Code')).toHaveValue('Formal');
  });
});

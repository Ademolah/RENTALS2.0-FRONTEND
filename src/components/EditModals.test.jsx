import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockObjectUrls, pngFile, pickFiles, fileInputs, formEntries, control, setValue } from '../test/modalKit';

vi.mock('../api/properties', () => ({ getPropertyById: vi.fn(), updateProperty: vi.fn(), deleteProperty: vi.fn() }));
vi.mock('../api/car', () => ({ getCarById: vi.fn(), updateCar: vi.fn(), deleteCar: vi.fn() }));
vi.mock('../api/hotel', () => ({ getHotelById: vi.fn(), updateHotel: vi.fn(), deleteHotel: vi.fn() }));
vi.mock('../api/vip', () => ({ getVipEstablishmentById: vi.fn(), updateVipEstablishment: vi.fn(), deleteVipEstablishment: vi.fn() }));

import { getPropertyById, updateProperty, deleteProperty } from '../api/properties';
import { getCarById, updateCar } from '../api/car';
import { getHotelById, updateHotel } from '../api/hotel';
import { getVipEstablishmentById, updateVipEstablishment } from '../api/vip';
import EditPropertyModal from './EditPropertyModal';
import EditCarModal from './EditCarModal';
import EditHotelModal from './EditHotelModal';
import EditVipModal from './EditVipModal';


beforeEach(() => {
  mockObjectUrls();
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

const property = {
  title: 'Sea View', description: 'Nice', pricePerNight: 90000, isAvailable: true, images: ['http://img/1.jpg', 'http://img/2.jpg'],
  address: { street: '1 Marina', city: 'Ikoyi', state: 'Lagos', country: 'Nigeria' }, capacity: { adults: 4, bedrooms: 2 },
};
const car = { make: 'Toyota', carModel: 'Camry', year: 2022, description: 'Clean', pricePer12Hours: 60000, seatNumber: 5, features: ['Leather Seats', 'GPS'], isAvailable: true, images: ['http://img/c1.jpg'] };
const hotel = {
  title: 'Grand', description: 'Big', hasBreakfast: true, address: { street: '2 Marina', city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
  amenities: ['Free Wifi'], roomTypes: [{ name: 'King', pricePerNight: 80000, totalInventory: 3, capacity: { adults: 2, children: 0 }, amenities: [] }], isAvailable: true, images: ['http://img/h1.jpg'],
};
const vip = {
  title: 'Velvet', description: 'Lounge', establishmentType: 'LOUNGE', depositAmount: 200000, dressCode: 'Smart',
  address: { street: '5 Club Rd', city: 'Ikoyi', state: 'Lagos' }, openHours: { open: '10:00 PM', close: '4:00 AM', daysOpen: ['Friday'] }, services: ['Shisha'], images: ['http://img/v1.jpg'],
};

const loaded = async (text) => { await screen.findByDisplayValue(text); };

describe('EditPropertyModal', () => {
  it('renders nothing when closed or without an id', () => {
    expect(render(<EditPropertyModal isOpen={false} propertyId="p1" onClose={vi.fn()} />).container).toBeEmptyDOMElement();
    expect(render(<EditPropertyModal isOpen propertyId={null} onClose={vi.fn()} />).container).toBeEmptyDOMElement();
  });

  it('shows a loading state, then the loaded listing', async () => {
    getPropertyById.mockResolvedValue({ data: { property } });
    render(<EditPropertyModal isOpen propertyId="p1" onClose={vi.fn()} />);
    expect(screen.getByText('Loading Property Data...')).toBeInTheDocument();
    await loaded('Sea View');
    expect(screen.getByText('Manage Shortlet')).toBeInTheDocument();
  });

  it('reports a failed load', async () => {
    getPropertyById.mockRejectedValue(new Error('x'));
    render(<EditPropertyModal isOpen propertyId="p1" onClose={vi.fn()} />);
    expect(await screen.findByText('Failed to fetch current property data.')).toBeInTheDocument();
  });

  it('saves changes with kept and new images', async () => {
    getPropertyById.mockResolvedValue({ data: { property } });
    updateProperty.mockResolvedValue({});
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { container } = render(<EditPropertyModal isOpen propertyId="p1" onClose={onClose} onSuccess={onSuccess} />);
    await loaded('Sea View');
    setValue(control(container, 'Property Title'), 'Sea View Deluxe');
    setValue(control(container, 'Nightly Rate'), '95000');
    fireEvent.click(container.querySelectorAll('button[aria-label="Delete"]')[0]);
    pickFiles(fileInputs(container)[0], [pngFile('new.png')]);
    fireEvent.click(container.querySelector('button.rounded-full.relative'));
    fireEvent.click(screen.getByText('Save & Publish Changes'));

    await waitFor(() => expect(updateProperty).toHaveBeenCalledTimes(1));
    const [id, body] = updateProperty.mock.calls[0];
    expect(id).toBe('p1');
    const e = formEntries(body);
    expect(e.title).toEqual(['Sea View Deluxe']);
    expect(e.pricePerNight).toEqual(['95000']);
    expect(e.isAvailable).toEqual(['false']);
    expect(e.existingImages).toEqual(['http://img/2.jpg']);
    expect(e.images).toEqual(['file:new.png']);
    expect(JSON.parse(e.address[0]).city).toBe('Ikoyi');
    expect(await screen.findByText('Property updated successfully!')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(1600);
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the server message when saving fails', async () => {
    getPropertyById.mockResolvedValue({ data: { property } });
    updateProperty.mockRejectedValue({ response: { data: { message: 'Not allowed' } } });
    render(<EditPropertyModal isOpen propertyId="p1" onClose={vi.fn()} />);
    await loaded('Sea View');
    fireEvent.click(screen.getByText('Save & Publish Changes'));
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
  });

  it('closes, and opens the delete confirmation', async () => {
    getPropertyById.mockResolvedValue({ data: { property } });
    deleteProperty.mockResolvedValue({});
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(<EditPropertyModal isOpen propertyId="p1" onClose={onClose} onSuccess={onSuccess} />);
    await loaded('Sea View');
    fireEvent.click(screen.getByText('Delete Listing'));
    expect(screen.getByText('Delete Listing?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Yes, Delete'));
    await waitFor(() => expect(deleteProperty).toHaveBeenCalledWith('p1'));
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe('EditCarModal', () => {
  it('renders nothing without an id', () => {
    expect(render(<EditCarModal isOpen carId={null} onClose={vi.fn()} />).container).toBeEmptyDOMElement();
  });

  it('shows the loaded vehicle', async () => {
    getCarById.mockResolvedValue({ data: { car } });
    const { container } = render(<EditCarModal isOpen carId="c1" onClose={vi.fn()} />);
    expect(screen.getByText('Loading Vehicle Specs...')).toBeInTheDocument();
    await loaded('Toyota');
    expect(control(container, 'Features')).toHaveValue('Leather Seats, GPS');
  });

  it('reports a failed load', async () => {
    getCarById.mockRejectedValue(new Error('x'));
    render(<EditCarModal isOpen carId="c1" onClose={vi.fn()} />);
    expect(await screen.findByText('Failed to fetch current vehicle data.')).toBeInTheDocument();
  });

  it('saves changes', async () => {
    getCarById.mockResolvedValue({ data: { car } });
    updateCar.mockResolvedValue({});
    const onSuccess = vi.fn();
    const { container } = render(<EditCarModal isOpen carId="c1" onClose={vi.fn()} onSuccess={onSuccess} />);
    await loaded('Toyota');
    setValue(control(container, 'Make'), 'Honda');
    setValue(control(container, '12-Hour Rate'), '65000');
    setValue(control(container, 'Features'), 'GPS, Sunroof');
    fireEvent.click(screen.getByText('Save & Publish Changes'));
    await waitFor(() => expect(updateCar).toHaveBeenCalledTimes(1));
    const [id, body] = updateCar.mock.calls[0];
    expect(id).toBe('c1');
    const e = formEntries(body);
    expect(e.make).toEqual(['Honda']);
    expect(e.pricePer12Hours).toEqual(['65000']);
    expect(e.features).toEqual(['GPS', 'Sunroof']);
    expect(e.existingImages).toEqual(['http://img/c1.jpg']);
    expect(await screen.findByText('Vehicle updated successfully!')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(1600);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows the server message when saving fails', async () => {
    getCarById.mockResolvedValue({ data: { car } });
    updateCar.mockRejectedValue({ response: { data: { message: 'Plate taken' } } });
    render(<EditCarModal isOpen carId="c1" onClose={vi.fn()} />);
    await loaded('Toyota');
    fireEvent.click(screen.getByText('Save & Publish Changes'));
    expect(await screen.findByText('Plate taken')).toBeInTheDocument();
  });
});

describe('EditHotelModal', () => {
  it('renders nothing without an id', () => {
    expect(render(<EditHotelModal isOpen hotelId={null} onClose={vi.fn()} />).container).toBeEmptyDOMElement();
  });

  it('shows the loaded hotel', async () => {
    getHotelById.mockResolvedValue({ data: { hotel } });
    render(<EditHotelModal isOpen hotelId="h1" onClose={vi.fn()} />);
    expect(screen.getByText('Loading Hotel Specs...')).toBeInTheDocument();
    await loaded('Grand');
  });

  it('reports a failed load', async () => {
    getHotelById.mockRejectedValue(new Error('x'));
    render(<EditHotelModal isOpen hotelId="h1" onClose={vi.fn()} />);
    expect(await screen.findByText('Failed to fetch current hotel data.')).toBeInTheDocument();
  });

  it('edits rooms and amenities and saves', async () => {
    getHotelById.mockResolvedValue({ data: { hotel } });
    updateHotel.mockResolvedValue({});
    const onSuccess = vi.fn();
    const { container } = render(<EditHotelModal isOpen hotelId="h1" onClose={vi.fn()} onSuccess={onSuccess} />);
    await loaded('Grand');
    fireEvent.click(screen.getByText('Restaurant'));
    fireEvent.click(screen.getByText('Add Room Category'));
    const names = [...container.querySelectorAll('input[type="text"]')].filter((i) => i.closest('.border-2'));
    setValue(names[1], 'Twin');
    const rates = [...container.querySelectorAll('input[type="number"]')];
    setValue(rates[0], '90000');
    fireEvent.click(screen.getByText('Save & Publish Changes'));
    await waitFor(() => expect(updateHotel).toHaveBeenCalledTimes(1));
    const [id, body] = updateHotel.mock.calls[0];
    expect(id).toBe('h1');
    const e = formEntries(body);
    expect(e.title).toEqual(['Grand']);
    expect(e.hasBreakfast).toEqual(['true']);
    expect(JSON.parse(e.amenities[0])).toEqual(['Free Wifi', 'Restaurant']);
    expect(JSON.parse(e.roomTypes[0])).toHaveLength(2);
    expect(e.startingPrice).toEqual(['0']);
    expect(JSON.parse(e.existingImages[0])).toEqual(['http://img/h1.jpg']);
    expect(await screen.findByText('Hotel updated successfully!')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(1600);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows the server message when saving fails', async () => {
    getHotelById.mockResolvedValue({ data: { hotel } });
    updateHotel.mockRejectedValue({ response: { data: { message: 'Hotel locked' } } });
    render(<EditHotelModal isOpen hotelId="h1" onClose={vi.fn()} />);
    await loaded('Grand');
    fireEvent.click(screen.getByText('Save & Publish Changes'));
    expect(await screen.findByText('Hotel locked')).toBeInTheDocument();
  });
});

describe('EditVipModal', () => {
  it('renders nothing when closed', () => {
    expect(render(<EditVipModal isOpen={false} establishmentId="v1" onClose={vi.fn()} />).container).toBeEmptyDOMElement();
  });

  it('shows the loaded venue', async () => {
    getVipEstablishmentById.mockResolvedValue({ data: { data: { establishment: vip } } });
    render(<EditVipModal isOpen establishmentId="v1" onClose={vi.fn()} />);
    expect(screen.getByText('Loading details...')).toBeInTheDocument();
    await loaded('Velvet');
    expect(screen.getByText('Edit VIP Listing')).toBeInTheDocument();
  });

  it('reports a failed load', async () => {
    getVipEstablishmentById.mockRejectedValue(new Error('x'));
    render(<EditVipModal isOpen establishmentId="v1" onClose={vi.fn()} />);
    expect(await screen.findByText('Failed to load establishment details.')).toBeInTheDocument();
  });

  it('saves changes', async () => {
    getVipEstablishmentById.mockResolvedValue({ data: { data: { establishment: vip } } });
    updateVipEstablishment.mockResolvedValue({});
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const { container } = render(<EditVipModal isOpen establishmentId="v1" onClose={onClose} onSuccess={onSuccess} />);
    await loaded('Velvet');
    setValue(control(container, 'Establishment Name'), 'Velvet Two');
    fireEvent.click(screen.getByText('Sat'));
    fireEvent.click(screen.getByText('Bottle Service'));
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => expect(updateVipEstablishment).toHaveBeenCalledTimes(1));
    const [id, body] = updateVipEstablishment.mock.calls[0];
    expect(id).toBe('v1');
    const e = formEntries(body);
    expect(e.title).toEqual(['Velvet Two']);
    expect(e.depositAmount).toEqual(['200000']);
    expect(e.open).toEqual(['10:00 PM']);
    expect(JSON.parse(e.daysOpen[0])).toEqual(['Friday', 'Saturday']);
    expect(JSON.parse(e.services[0])).toEqual(['Shisha', 'Bottle Service']);
    expect(JSON.parse(e.existingImages[0])).toEqual(['http://img/v1.jpg']);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('requires at least one photo', async () => {
    getVipEstablishmentById.mockResolvedValue({ data: { data: { establishment: { ...vip, images: [] } } } });
    render(<EditVipModal isOpen establishmentId="v1" onClose={vi.fn()} />);
    await loaded('Velvet');
    fireEvent.click(screen.getByText('Save Changes'));
    expect(await screen.findByText('Please upload or keep at least one photograph.')).toBeInTheDocument();
    expect(updateVipEstablishment).not.toHaveBeenCalled();
  });

  it('limits photos to 10 and shows the server message on failure', async () => {
    getVipEstablishmentById.mockResolvedValue({ data: { data: { establishment: vip } } });
    updateVipEstablishment.mockRejectedValue({ response: { data: { message: 'Venue locked' } } });
    const { container } = render(<EditVipModal isOpen establishmentId="v1" onClose={vi.fn()} />);
    await loaded('Velvet');
    pickFiles(fileInputs(container)[0], Array.from({ length: 10 }, (_, i) => pngFile(`p${i}.png`)));
    expect(screen.getByText('Maximum of 10 photos allowed.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Save Changes'));
    expect(await screen.findByText('Venue locked')).toBeInTheDocument();
  });
});

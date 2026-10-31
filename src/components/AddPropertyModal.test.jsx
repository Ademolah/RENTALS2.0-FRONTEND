import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockObjectUrls, pngFile, mp4File, pickFiles, imageInput, videoInput, formEntries, control, setValue } from '../test/modalKit';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() }));
vi.mock('./Toast', () => ({ useToast: () => toast }));
vi.mock('../api/properties', () => ({ createProperty: vi.fn() }));
vi.mock('./host/hostApi', () => ({ fetchSuggestedPrice: vi.fn().mockResolvedValue({ price: null, count: 0, scope: '' }) }));

import { createProperty } from '../api/properties';
import AddPropertyModal from './AddPropertyModal';

let resetUrls;
beforeEach(() => {
  localStorage.clear();
  resetUrls = mockObjectUrls();
  vi.clearAllMocks();
  globalThis.fetch = vi.fn().mockResolvedValue({ json: async () => [{ lat: '6.5', lon: '3.4' }] });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

const fill = (container) => {
  setValue(control(container, 'Listing Title'), 'Sea View Suite');
  setValue(control(container, 'Compelling Description'), 'Lovely flat');
  setValue(control(container, 'Street Address'), '15 Bourdillon Road');
  setValue(control(container, 'State'), 'Lagos');
  setValue(control(container, 'City / Neighborhood'), 'Ikoyi');
};

describe('AddPropertyModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<AddPropertyModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the form with host-side commission wording', () => {
    resetUrls();
    render(<AddPropertyModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Create Listing')).toBeInTheDocument();
    expect(screen.getByText('Platform commission (5%)')).toBeInTheDocument();
    expect(screen.getByText('₦142,500')).toBeInTheDocument();
  });

  it('closes from the close button', () => {
    const onClose = vi.fn();
    render(<AddPropertyModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('only offers cities for the chosen state', () => {
    const { container } = render(<AddPropertyModal isOpen onClose={vi.fn()} />);
    const city = control(container, 'City / Neighborhood');
    expect(city).toBeDisabled();
    setValue(control(container, 'State'), 'Abuja');
    expect(city).not.toBeDisabled();
    expect([...city.options].map((o) => o.value)).toContain('Maitama');
    expect([...city.options].map((o) => o.value)).not.toContain('Ikoyi');
  });

  it('requires at least one photo', async () => {
    const { container } = render(<AddPropertyModal isOpen onClose={vi.fn()} />);
    fill(container);
    fireEvent.submit(container.querySelector('#property-form'));
    expect(await screen.findByText('Please upload at least one pristine photograph of the property.')).toBeInTheDocument();
    expect(createProperty).not.toHaveBeenCalled();
  });

  it('limits photos to 15 and videos to 50MB', () => {
    const { container } = render(<AddPropertyModal isOpen onClose={vi.fn()} />);
    pickFiles(imageInput(container), Array.from({ length: 16 }, (_, i) => pngFile(`p${i}.png`)));
    expect(screen.getByText('Maximum of 15 photos allowed to maintain platform standards.')).toBeInTheDocument();
    pickFiles(videoInput(container), [mp4File('big.mp4', 60 * 1024 * 1024)]);
    expect(screen.getByText('Video exceeds the 50MB size limit.')).toBeInTheDocument();
  });

  it('toggles amenities and removes a photo', () => {
    resetUrls();
    const { container } = render(<AddPropertyModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Swimming Pool'));
    expect(screen.getByText('Swimming Pool').className).toMatch(/bg-gray-900/);
    fireEvent.click(screen.getByText('Swimming Pool'));
    expect(screen.getByText('Swimming Pool').className).not.toMatch(/bg-gray-900/);
    pickFiles(imageInput(container), [pngFile('a.png'), pngFile('b.png')]);
    expect(screen.getAllByAltText(/Preview/)).toHaveLength(2);
    fireEvent.click(container.querySelectorAll('img[alt^="Preview"]')[0].parentElement.querySelector('button'));
    expect(screen.getAllByAltText(/Preview/)).toHaveLength(1);
  });

  it('geocodes, submits the listing and reports the created property', async () => {
    createProperty.mockResolvedValue({ data: { property: { _id: 'p1', title: 'Sea View Suite' } } });
    const onClose = vi.fn();
    const onPropertyAdded = vi.fn();
    const { container } = render(<AddPropertyModal isOpen onClose={onClose} onPropertyAdded={onPropertyAdded} />);
    fill(container);
    fireEvent.click(screen.getByText('Swimming Pool'));
    pickFiles(imageInput(container), [pngFile('front.png')]);
    fireEvent.submit(container.querySelector('#property-form'));

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1));
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const e = formEntries(createProperty.mock.calls[0][0]);
    expect(e.title).toEqual(['Sea View Suite']);
    expect(e.category).toEqual(['SHORTLET']);
    expect(e.pricePerNight).toEqual(['150000']);
    expect(e.maxGuests).toEqual(['2']);
    expect(e.bedrooms).toEqual(['1']);
    expect(e.bathrooms).toEqual(['1']);
    expect(e.amenities).toEqual(['Swimming Pool']);
    expect(e.images).toEqual(['file:front.png']);
    expect(JSON.parse(e.address[0])).toEqual({
      street: '15 Bourdillon Road', city: 'Ikoyi', state: 'Lagos', country: 'Nigeria', coordinates: { lat: 6.5, lng: 3.4 },
    });
    expect(toast.success).toHaveBeenCalledWith('Listing published. It goes live after a quick verification.');

    await vi.advanceTimersByTimeAsync(2600);
    expect(onPropertyAdded).toHaveBeenCalledWith({ _id: 'p1', title: 'Sea View Suite' });
    expect(onClose).toHaveBeenCalled();
  });

  it('still submits when geocoding fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    createProperty.mockResolvedValue({ data: { property: { _id: 'p2' } } });
    const { container } = render(<AddPropertyModal isOpen onClose={vi.fn()} />);
    fill(container);
    pickFiles(imageInput(container), [pngFile()]);
    fireEvent.submit(container.querySelector('#property-form'));
    await waitFor(() => expect(createProperty).toHaveBeenCalled());
    const addr = JSON.parse(formEntries(createProperty.mock.calls[0][0]).address[0]);
    expect(addr.coordinates).toEqual({});
  });

  it('shows the server message when publishing fails', async () => {
    createProperty.mockRejectedValue({ response: { data: { message: 'Title already exists' } } });
    const { container } = render(<AddPropertyModal isOpen onClose={vi.fn()} />);
    fill(container);
    pickFiles(imageInput(container), [pngFile()]);
    fireEvent.submit(container.querySelector('#property-form'));
    expect(await screen.findByText('Title already exists')).toBeInTheDocument();
  });

  it('restores a saved draft', () => {
    localStorage.setItem('rentals_draft_property', JSON.stringify({ savedAt: Date.now(), values: { title: 'Saved title', bedrooms: 3, amenities: ['Smart TV'] } }));
    const { container } = render(<AddPropertyModal isOpen onClose={vi.fn()} />);
    expect(control(container, 'Listing Title')).toHaveValue('Saved title');
    expect(screen.getByText(/Draft saved/)).toBeInTheDocument();
    expect(screen.getByText('Smart TV').className).toMatch(/bg-gray-900/);
  });
});

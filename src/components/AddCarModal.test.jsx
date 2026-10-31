import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockObjectUrls, pngFile, mp4File, pickFiles, imageInput, videoInput, formEntries } from '../test/modalKit';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() }));
vi.mock('./Toast', () => ({ useToast: () => toast }));
vi.mock('axios', () => ({ default: { post: vi.fn(), interceptors: { response: { use: vi.fn() } } } }));

import axios from 'axios';
import AddCarModal from './AddCarModal';

let resetUrls;
beforeEach(() => {
  localStorage.clear();
  resetUrls = mockObjectUrls();
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

const fill = () => {
  fireEvent.change(screen.getByPlaceholderText('Mercedes-Benz'), { target: { value: 'Toyota' } });
  fireEvent.change(screen.getByPlaceholderText('G63 AMG'), { target: { value: 'Camry' } });
  fireEvent.change(screen.getByPlaceholderText('Victoria Island'), { target: { value: 'Ikoyi' } });
  fireEvent.change(screen.getByPlaceholderText(/Describe the vehicle/), { target: { value: 'Clean car' } });
};

describe('AddCarModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<AddCarModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the form with host-side commission wording', () => {
    resetUrls();
    render(<AddCarModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('List Vehicle')).toBeInTheDocument();
    expect(screen.getByText('Platform commission (5%)')).toBeInTheDocument();
    expect(screen.getByText('Estimated Net: ₦142,500')).toBeInTheDocument();
  });

  it('closes from the close button', () => {
    const onClose = vi.fn();
    render(<AddCarModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getAllByLabelText('Close')[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('requires at least one photo', async () => {
    render(<AddCarModal isOpen onClose={vi.fn()} />);
    fill();
    fireEvent.click(screen.getByText('Confirm Listing'));
    expect(await screen.findByText('Please upload at least one image of the vehicle.')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('rejects a video over 50MB', () => {
    const { container } = render(<AddCarModal isOpen onClose={vi.fn()} />);
    pickFiles(videoInput(container), [mp4File('big.mp4', 60 * 1024 * 1024)]);
    expect(screen.getByText('Video exceeds the 50MB size limit.')).toBeInTheDocument();
  });

  it('limits photos to 10', () => {
    const { container } = render(<AddCarModal isOpen onClose={vi.fn()} />);
    pickFiles(imageInput(container), Array.from({ length: 11 }, (_, i) => pngFile(`p${i}.png`)));
    expect(screen.getByText('Maximum 10 images allowed.')).toBeInTheDocument();
  });

  it('submits the vehicle and reports the created car', async () => {
    resetUrls();
    axios.post.mockResolvedValue({ data: { data: { car: { _id: 'c1', make: 'Toyota' } } } });
    const onClose = vi.fn();
    const onCarAdded = vi.fn();
    const { container } = render(<AddCarModal isOpen onClose={onClose} onCarAdded={onCarAdded} />);
    fill();
    pickFiles(imageInput(container), [pngFile('front.png')]);
    pickFiles(videoInput(container), [mp4File()]);
    fireEvent.click(screen.getByText('Confirm Listing'));

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    const [url, body] = axios.post.mock.calls[0];
    expect(url).toMatch(/\/cars$/);
    const e = formEntries(body);
    expect(e.make).toEqual(['Toyota']);
    expect(e.carModel).toEqual(['Camry']);
    expect(e.category).toEqual(['LUXURY']);
    expect(e.transmission).toEqual(['AUTOMATIC']);
    expect(e.seatNumber).toEqual(['4']);
    expect(e.pricePer12Hours).toEqual(['150000']);
    expect(JSON.parse(e.location[0])).toEqual({ city: 'Ikoyi', state: 'Lagos' });
    expect(e.images).toEqual(['file:front.png']);
    expect(e.video).toEqual(['file:tour.mp4']);
    expect(toast.success).toHaveBeenCalledWith('Vehicle added to your fleet. It goes live after approval.');

    await vi.advanceTimersByTimeAsync(2100);
    expect(onCarAdded).toHaveBeenCalledWith({ _id: 'c1', make: 'Toyota' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the server message when listing fails', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Plate already listed' } } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<AddCarModal isOpen onClose={vi.fn()} />);
    fill();
    pickFiles(imageInput(container), [pngFile()]);
    fireEvent.click(screen.getByText('Confirm Listing'));
    expect(await screen.findByText('Plate already listed')).toBeInTheDocument();
  });

  it('toggles features', () => {
    render(<AddCarModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Sunroof / Moonroof'));
    expect(screen.getByText('1 Selected')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sunroof / Moonroof'));
    expect(screen.getByText('0 Selected')).toBeInTheDocument();
  });
});

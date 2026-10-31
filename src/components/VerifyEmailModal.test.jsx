import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../api/auth', () => ({ verifyEmailApi: vi.fn().mockResolvedValue({ token: 't', data: { user: { id: 1 } } }) }));
vi.mock('./Toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() }) }));

import { VerifyEmailModal } from './VerifyEmailModal';
import { verifyEmailApi } from '../api/auth';

describe('VerifyEmailModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<VerifyEmailModal isOpen={false} onClose={() => {}} email="a@b.co" onSuccess={() => {}} onResend={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the email prompt and a working close button', () => {
    const onClose = vi.fn();
    render(<VerifyEmailModal isOpen onClose={onClose} email="a@b.co" onSuccess={() => {}} onResend={() => {}} />);
    expect(screen.getByText('Check your email')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close and go back' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('submits automatically once all six digits are typed', async () => {
    const onSuccess = vi.fn();
    render(<VerifyEmailModal isOpen onClose={() => {}} email="a@b.co" onSuccess={onSuccess} onResend={() => {}} />);
    const boxes = document.querySelectorAll('input');
    '123456'.split('').forEach((d, i) => fireEvent.change(boxes[i], { target: { value: d } }));
    await waitFor(() => expect(verifyEmailApi).toHaveBeenCalledWith('a@b.co', '123456'));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('t', { id: 1 }));
  });
});

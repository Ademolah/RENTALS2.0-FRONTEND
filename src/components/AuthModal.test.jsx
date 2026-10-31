import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@react-oauth/google', () => ({ GoogleLogin: () => <div>GOOGLE-BUTTON</div>, googleLogout: vi.fn() }));
vi.mock('../api/auth', () => ({ registerUser: vi.fn(), loginApi: vi.fn() }));
vi.mock('../context/AuthContext', async () => {
  const { authValue } = await import('../test/helpers');
  return { useAuth: () => authValue(null) };
});
vi.mock('./Toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() }) }));
vi.mock('./ForgotPasswordModal', () => ({ default: () => null }));
vi.mock('./VerifyEmailModal', () => ({ VerifyEmailModal: () => null }));
vi.mock('./profile/InterestsPicker', () => ({ default: () => null }));

import AuthModal from './AuthModal';

const submitForm = () => fireEvent.submit(document.querySelector('form'));

describe('AuthModal', () => {
  beforeEach(() => localStorage.clear());

  it('renders nothing when closed', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens on Sign in with the Google button', () => {
    render(<AuthModal isOpen onClose={() => {}} />);
    expect(screen.getByText('Welcome back.')).toBeInTheDocument();
    expect(screen.getByText('GOOGLE-BUTTON')).toBeInTheDocument();
  });

  it('shows inline validation for an empty sign-in', () => {
    render(<AuthModal isOpen onClose={() => {}} />);
    submitForm();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
  });

  it('switches to registration and validates names and passwords', () => {
    render(<AuthModal isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByText('Sign up'));
    expect(screen.getByText('Create account.')).toBeInTheDocument();
    submitForm();
    expect(screen.getByText('Enter your first name')).toBeInTheDocument();
    expect(screen.getByText('Enter your last name')).toBeInTheDocument();
  });

  it('forgets typed values and returns to Sign in after closing', () => {
    const { rerender } = render(<AuthModal isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByText('Sign up'));
    fireEvent.change(document.querySelector('input[name="email"]'), { target: { value: 'typed@example.com' } });
    rerender(<AuthModal isOpen={false} onClose={() => {}} />);
    rerender(<AuthModal isOpen onClose={() => {}} />);
    expect(screen.getByText('Welcome back.')).toBeInTheDocument();
    expect(document.querySelector('input[name="email"]').value).toBe('');
    expect(screen.queryByDisplayValue('typed@example.com')).toBeNull();
  });
});

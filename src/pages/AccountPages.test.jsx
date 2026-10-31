import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderPage, guestUser } from '../test/helpers';

let currentUser = null;
vi.mock('../context/AuthContext', async () => {
  const { authValue } = await import('../test/helpers');
  return { useAuth: () => authValue(currentUser) };
});
vi.mock('../components/Toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() }) }));
vi.mock('../api/trips', async () => {
  const actual = await vi.importActual('../api/trips');
  return { ...actual, fetchGuestBookings: vi.fn().mockResolvedValue([]) };
});
vi.mock('../api/user', () => ({
  getMyFavoritesApi: vi.fn().mockResolvedValue({ data: { favorites: [] } }),
  toggleFavoriteApi: vi.fn(),
  getMyProfileApi: vi.fn().mockResolvedValue({ data: { user: { firstName: 'Tobi', lastName: 'Guest', phoneNumber: '08012345678' } } }),
  updateMyProfileApi: vi.fn(), deleteMyAccountApi: vi.fn(), uploadAvatarApi: vi.fn(), getUnreadCountApi: vi.fn().mockResolvedValue(0),
}));
vi.mock('../api/host', () => ({ HostService: { getStatus: vi.fn().mockResolvedValue({ status: 'IDLE' }), getHostStatus: vi.fn().mockResolvedValue({ status: 'IDLE' }) } }));
vi.mock('../components/HostUpgradeModal', () => ({ default: () => null }));
vi.mock('../components/profile/AvatarUploader', () => ({ default: () => <div>AVATAR</div> }));
vi.mock('../components/profile/InterestsPicker', () => ({ default: () => <div>INTERESTS</div> }));

import Trips from './Trips';
import Saved from './Saved';
import Profile from './Profile';
import Help from './Help';

beforeEach(() => { currentUser = null; localStorage.clear(); });

describe('account pages signed out', () => {
  it.each([['Trips', Trips], ['Saved', Saved]])('%s asks to sign in', (_n, Page) => {
    renderPage(<Page />);
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
  });

  it('Profile asks to sign in', () => {
    renderPage(<Profile />);
    expect(screen.getByText('Sign in to see your profile')).toBeInTheDocument();
  });
});

describe('account pages signed in', () => {
  beforeEach(() => { currentUser = guestUser; localStorage.setItem('rentals_token', 'x'); });

  it('Trips shows the empty state with a way to start exploring', async () => {
    renderPage(<Trips />);
    expect(screen.getByText('My trips')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Start exploring')).toBeInTheDocument());
  });

  it('Saved shows the empty state', async () => {
    renderPage(<Saved />);
    await waitFor(() => expect(screen.getByText('No saved stays yet')).toBeInTheDocument());
  });

  it('Profile loads the personal details form', async () => {
    renderPage(<Profile />);
    await waitFor(() => expect(screen.getByText('Personal information')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByDisplayValue('Tobi')).toBeInTheDocument());
  });
});

describe('Help', () => {
  it('offers WhatsApp checkout and concierge help', () => {
    renderPage(<Help />);
    expect(screen.getByText('How can we help?')).toBeInTheDocument();
    expect(screen.getAllByText(/Check out via WhatsApp/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ask the concierge/).length).toBeGreaterThan(0);
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
  });
});

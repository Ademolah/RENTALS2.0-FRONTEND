import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderPage, hostUser, guestUser } from '../test/helpers';

let currentUser = null;
vi.mock('../context/AuthContext', async () => {
  const { authValue: av } = await import('../test/helpers');
  return { useAuth: () => av(currentUser) };
});
vi.mock('./AuthModal', () => ({ default: () => null }));
vi.mock('../api/user', () => ({ getUnreadCountApi: vi.fn().mockResolvedValue(3) }));

import Navbar from './Navbar';

beforeEach(() => { currentUser = null; });

describe('Navbar', () => {
  it('signed out: Home, Help, Become a host, Sign in; no account links', () => {
    renderPage(<Navbar />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Help' })).toBeInTheDocument();
    expect(screen.getAllByText('Become a host').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sign in').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Trips' })).toBeNull();
  });

  it('guest: Home, Trips, Saved, Help and the notifications bell with unread count', async () => {
    currentUser = guestUser;
    renderPage(<Navbar />);
    for (const n of ['Home', 'Trips', 'Saved', 'Help']) expect(screen.getByRole('link', { name: n })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: /Notifications, 3 unread/ })).toBeInTheDocument());
    expect(screen.queryByText('Switch to hosting')).toBeNull();
  });

  it('host on a guest page offers Switch to hosting', () => {
    currentUser = hostUser;
    renderPage(<Navbar />, { route: '/' });
    expect(screen.getAllByText('Switch to hosting').length).toBeGreaterThan(0);
  });

  it('host on /dashboard/landlord shows the Hosting bar with Switch to traveling', () => {
    currentUser = hostUser;
    renderPage(<Navbar />, { route: '/dashboard/landlord' });
    expect(screen.getByText('Hosting')).toBeInTheDocument();
    expect(screen.getAllByText('Switch to traveling').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Trips' })).toBeNull();
  });

  it('the hamburger icon only exists below the lg breakpoint', () => {
    currentUser = guestUser;
    const { container } = renderPage(<Navbar />);
    const btn = container.querySelector('button[aria-label="Account menu"]');
    const icons = [...btn.querySelectorAll('span')].filter((el) => el.className.split(' ').includes('lg:hidden'));
    expect(icons.length).toBe(1);
  });

  it('the account menu opens and shows Profile and Sign out', () => {
    currentUser = guestUser;
    renderPage(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    expect(screen.getByText('Sign out')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders the search slot when given', () => {
    renderPage(<Navbar center={<div>SEARCH-SLOT</div>} />);
    expect(screen.getByText('SEARCH-SLOT')).toBeInTheDocument();
  });
});

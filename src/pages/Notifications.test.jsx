import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderPage } from '../test/helpers';

vi.mock('../api/notifications', () => ({
  getNotifications: vi.fn().mockResolvedValue([
    { id: 'n1', title: 'Booking confirmed', body: 'Your stay is booked', type: 'NEW_BOOKING', isRead: false, createdAt: Date.now() },
  ]),
  markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn(), deleteNotification: vi.fn(), clearAllNotifications: vi.fn(),
}));
vi.mock('../context/AuthContext', async () => {
  const { authValue } = await import('../test/helpers');
  return { useAuth: () => authValue() };
});

import Notifications from './Notifications';

describe('Notifications page', () => {
  it('lists notifications for a signed-in user', async () => {
    localStorage.setItem('rentals_token', 'x');
    renderPage(<Notifications />);
    await waitFor(() => expect(screen.getByText('Booking confirmed')).toBeInTheDocument());
  });
});

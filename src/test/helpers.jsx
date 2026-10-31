import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

// Signed-in user for tests; override per test with mockAuth({ role: 'USER' }).
export const hostUser = { _id: 'u1', id: 'u1', firstName: 'Ada', lastName: 'Host', role: 'LANDLORD', email: 'ada@example.com' };
export const guestUser = { _id: 'u2', id: 'u2', firstName: 'Tobi', lastName: 'Guest', role: 'USER', email: 'tobi@example.com' };

export function authValue(user = hostUser, extra = {}) {
  return {
    user,
    logout: vi.fn(),
    login: vi.fn(),
    completeSignIn: vi.fn(),
    finishSignIn: vi.fn(),
    updateUser: vi.fn(),
    requireAuth: (fn) => { fn?.(); return true; },
    redirectUserByRole: vi.fn(),
    showAuthModal: false,
    setShowAuthModal: vi.fn(),
    ...extra,
  };
}

export function renderPage(ui, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

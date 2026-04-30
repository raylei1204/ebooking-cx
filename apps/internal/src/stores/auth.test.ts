import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './auth';

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('stores tokens and current user on successful login', async () => {
    const login = vi.fn().mockResolvedValue({
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          organizationId: null,
          roles: ['admin']
        }
      }
    });

    const authStore = useAuthStore();
    authStore.setApiClient({
      login,
      refresh: vi.fn(),
      logout: vi.fn()
    });

    await authStore.login({
      email: 'admin@example.com',
      password: 'Password123!'
    });

    expect(login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'Password123!'
    });
    expect(authStore.accessToken).toBe('access-token');
    expect(authStore.refreshToken).toBe('refresh-token');
    expect(authStore.currentUser?.roles).toEqual(['admin']);
  });

  it('exposes the invalid-credential message when login is rejected with 401', async () => {
    const authStore = useAuthStore();
    authStore.setApiClient({
      login: vi.fn().mockRejectedValue({
        statusCode: 401,
        message: 'Invalid email or password'
      }),
      refresh: vi.fn(),
      logout: vi.fn()
    });

    await expect(
      authStore.login({
        email: 'admin@example.com',
        password: 'wrong-password'
      })
    ).rejects.toMatchObject({
      statusCode: 401
    });

    expect(authStore.loginError).toBe('Invalid email or password');
  });
});

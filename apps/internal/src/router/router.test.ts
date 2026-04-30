import { describe, expect, it } from 'vitest';

import { createAppRouter } from './index';

describe('internal auth router guards', () => {
  it('redirects unauthenticated users to /login when they visit a protected route', async () => {
    const router = createAppRouter();

    await router.push('/dashboard');
    await router.isReady();

    expect(router.currentRoute.value.fullPath).toBe('/login');
  });

  it('redirects authenticated non-admin users away from /system/organization to /403', async () => {
    window.localStorage.setItem(
      'internal-auth',
      JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'ops@example.com',
          name: 'Ops User',
          organizationId: 'org-1',
          roles: ['agent']
        }
      })
    );

    const router = createAppRouter();

    await router.push('/system/organization');
    await router.isReady();

    expect(router.currentRoute.value.fullPath).toBe('/403');
  });
});

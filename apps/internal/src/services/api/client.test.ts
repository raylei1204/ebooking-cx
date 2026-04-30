import { describe, expect, it, vi } from 'vitest';

import { apiRequest } from './client';

describe('apiRequest', () => {
  it('returns an empty success payload for 204 responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      apiRequest<undefined>('/api/v1/internal/users/user-1', {
        method: 'DELETE',
        accessToken: 'access-token'
      })
    ).resolves.toEqual({
      data: undefined
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/internal/users/user-1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token'
        })
      })
    );
  });
});

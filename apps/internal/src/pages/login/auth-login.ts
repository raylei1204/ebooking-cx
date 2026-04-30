import type { InjectionKey } from 'vue';

import type { LoginRequest } from '@ebooking-cx/shared';

export const authLoginKey: InjectionKey<
  (payload: LoginRequest) => Promise<void>
> = Symbol('auth-login');

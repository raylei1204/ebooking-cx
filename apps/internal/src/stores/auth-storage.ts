import type { AuthStateSnapshot } from '@/services/api';

export const AUTH_STORAGE_KEY = 'internal-auth';

export function readAuthSnapshot(): AuthStateSnapshot | null {
  const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (storedValue === null) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as AuthStateSnapshot;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeAuthSnapshot(snapshot: AuthStateSnapshot): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearAuthSnapshot(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

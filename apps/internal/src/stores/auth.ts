import type {
  AuthenticatedUserSummary,
  LoginRequest,
  RoleName
} from '@ebooking-cx/shared';
import { defineStore } from 'pinia';

import {
  clearAuthSnapshot,
  readAuthSnapshot,
  writeAuthSnapshot
} from './auth-storage';
import {
  createAuthApiClient,
  type ApiClientError,
  type AuthApiClient,
  type AuthStateSnapshot
} from '@/services/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: AuthenticatedUserSummary | null;
  loginError: string | null;
  isLoggingIn: boolean;
  apiClient: AuthApiClient;
}

function persistSnapshot(snapshot: AuthStateSnapshot): void {
  writeAuthSnapshot(snapshot);
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: null,
    refreshToken: null,
    currentUser: null,
    loginError: null,
    isLoggingIn: false,
    apiClient: createAuthApiClient()
  }),
  getters: {
    isAuthenticated: (state): boolean =>
      state.accessToken !== null && state.currentUser !== null,
    isAdmin: (state): boolean =>
      state.currentUser?.roles.includes('admin') ?? false
  },
  actions: {
    setApiClient(apiClient: AuthApiClient): void {
      this.apiClient = apiClient;
    },
    initializeFromStorage(): void {
      const snapshot = readAuthSnapshot();

      if (snapshot === null) {
        return;
      }

      this.accessToken = snapshot.accessToken;
      this.refreshToken = snapshot.refreshToken;
      this.currentUser = snapshot.user;
    },
    async login(credentials: LoginRequest): Promise<void> {
      this.isLoggingIn = true;
      this.loginError = null;

      try {
        const response = await this.apiClient.login(credentials);

        this.accessToken = response.data.accessToken;
        this.refreshToken = response.data.refreshToken;
        this.currentUser = response.data.user;

        persistSnapshot({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user
        });
      } catch (error) {
        const apiError = error as ApiClientError;

        if (apiError.statusCode === 401) {
          this.loginError = 'Invalid email or password';
        } else if (apiError.statusCode === 403) {
          this.loginError = 'This user account is disabled.';
        } else {
          this.loginError = 'Unable to sign in right now.';
        }

        throw error;
      } finally {
        this.isLoggingIn = false;
      }
    },
    async refreshSession(): Promise<boolean> {
      if (this.refreshToken === null || this.currentUser === null) {
        this.clearAuth();
        return false;
      }

      try {
        const response = await this.apiClient.refresh({
          refreshToken: this.refreshToken
        });

        this.accessToken = response.data.accessToken;
        this.refreshToken = response.data.refreshToken;

        persistSnapshot({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: this.currentUser
        });

        return true;
      } catch {
        this.clearAuth();
        return false;
      }
    },
    async logout(): Promise<void> {
      const accessToken = this.accessToken;
      const refreshToken = this.refreshToken;

      try {
        if (accessToken !== null && refreshToken !== null) {
          await this.apiClient.logout(
            {
              refreshToken
            },
            accessToken
          );
        }
      } finally {
        this.clearAuth();
      }
    },
    clearAuth(): void {
      this.accessToken = null;
      this.refreshToken = null;
      this.currentUser = null;
      this.loginError = null;
      clearAuthSnapshot();
    },
    userHasRole(role: RoleName): boolean {
      return this.currentUser?.roles.includes(role) ?? false;
    }
  }
});

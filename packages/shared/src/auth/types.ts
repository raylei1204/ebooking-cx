export const ROLE_NAMES = ['admin', 'shipper', 'consignee', 'agent'] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export interface AuthenticatedUserSummary {
  id: string;
  email: string;
  name: string;
  organizationId: string | null;
  roles: RoleName[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface TokenResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseData extends TokenResponseData {
  user: AuthenticatedUserSummary;
}

export interface LogoutResponseData {
  success: true;
}

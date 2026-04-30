import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthenticatedUserSummary,
  LoginRequest,
  LoginResponseData,
  LogoutRequest,
  RefreshTokenRequest,
  TokenResponseData
} from '@ebooking-cx/shared';

export interface ApiClientError {
  code: string;
  message: string;
  statusCode: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string;
}

export interface AuthApiClient {
  login(request: LoginRequest): Promise<ApiSuccessResponse<LoginResponseData>>;
  refresh(
    request: RefreshTokenRequest
  ): Promise<ApiSuccessResponse<TokenResponseData>>;
  logout(
    request: LogoutRequest,
    accessToken: string
  ): Promise<ApiSuccessResponse<{ success: true }>>;
}

export interface AuthStateSnapshot {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUserSummary;
}

export interface AuthApiClientConfig {
  baseUrl?: string;
}

export interface ApiEnvelopeMap {
  login: ApiSuccessResponse<LoginResponseData>;
  refresh: ApiSuccessResponse<TokenResponseData>;
  logout: ApiSuccessResponse<{ success: true }>;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'object' &&
    value.error !== null
  );
}

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthenticatedUserSummary,
  BookingDetails,
  BookingDraftListFilters,
  BookingDraftListItem,
  BookingLookupParty,
  BookingLookupPartyFilters,
  BookingLookupPort,
  BookingLookupPortFilters,
  BookingPoImportResponseData,
  BookingSummary,
  CreateBookingPayload,
  LoginRequest,
  LoginResponseData,
  LogoutRequest,
  RefreshTokenRequest,
  TokenResponseData,
  UpdateBookingPayload
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

export interface AdminApiClient {
  createBooking(
    payload: CreateBookingPayload,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingSummary>>;
  updateBooking(
    bookingId: string,
    payload: UpdateBookingPayload,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingSummary>>;
  getBooking(
    bookingId: string,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingDetails>>;
  listBookings(
    filters: BookingDraftListFilters,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingDraftListItem[]>>;
  listParties(
    filters: BookingLookupPartyFilters,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingLookupParty[]>>;
  listPorts(
    filters: BookingLookupPortFilters,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingLookupPort[]>>;
  importBookingPoFile(
    file: FormData,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingPoImportResponseData>>;
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

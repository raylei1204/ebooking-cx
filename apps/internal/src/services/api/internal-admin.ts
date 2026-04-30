import type {
  ApiSuccessResponse,
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
  ChangeUserPasswordPayload,
  CreateUserResponseData,
  OrganizationListFilters,
  OrganizationPayload,
  OrganizationRelationshipPayload,
  OrganizationRelationshipSummary,
  OrganizationSummary,
  UpdateBookingPayload,
  UserMutationMeta,
  UserPayload,
  UserSummary
} from '@ebooking-cx/shared';
import type { InjectionKey } from 'vue';

import { apiRequest } from './client';
import type { AuthApiClientConfig } from './types';

export interface AdminApiClient {
  listOrganizations(
    filters: OrganizationListFilters,
    accessToken: string
  ): Promise<ApiSuccessResponse<OrganizationSummary[]>>;
  createOrganization(
    payload: OrganizationPayload,
    accessToken: string
  ): Promise<ApiSuccessResponse<OrganizationSummary>>;
  createBooking(
    payload: CreateBookingPayload,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingSummary>>;
  updateOrganization(
    organizationId: string,
    payload: Partial<OrganizationPayload>,
    accessToken: string
  ): Promise<ApiSuccessResponse<OrganizationSummary>>;
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
    formData: FormData,
    accessToken: string
  ): Promise<ApiSuccessResponse<BookingPoImportResponseData>>;
  deleteOrganization(
    organizationId: string,
    accessToken: string
  ): Promise<void>;
  listOrganizationRelationships(
    organizationId: string,
    accessToken: string
  ): Promise<ApiSuccessResponse<OrganizationRelationshipSummary[]>>;
  createOrganizationRelationship(
    organizationId: string,
    payload: OrganizationRelationshipPayload,
    accessToken: string
  ): Promise<ApiSuccessResponse<OrganizationRelationshipSummary>>;
  deleteOrganizationRelationship(
    organizationId: string,
    relationshipId: string,
    accessToken: string
  ): Promise<void>;
  listOrganizationUsers(
    organizationId: string,
    accessToken: string
  ): Promise<ApiSuccessResponse<UserSummary[]>>;
  listAdminUsers(
    accessToken: string
  ): Promise<ApiSuccessResponse<UserSummary[]>>;
  createUser(
    payload: UserPayload,
    accessToken: string
  ): Promise<ApiSuccessResponse<CreateUserResponseData, UserMutationMeta>>;
  updateUser(
    userId: string,
    payload: Partial<UserPayload>,
    accessToken: string
  ): Promise<ApiSuccessResponse<UserSummary, UserMutationMeta>>;
  deleteUser(userId: string, accessToken: string): Promise<void>;
  changeUserPassword(
    userId: string,
    payload: ChangeUserPasswordPayload,
    accessToken: string
  ): Promise<ApiSuccessResponse<{ success: true }>>;
}

export const adminApiClientKey: InjectionKey<AdminApiClient> =
  Symbol('admin-api-client');

export function createAdminApiClient(
  config: AuthApiClientConfig = {}
): AdminApiClient {
  return {
    listOrganizations(filters, accessToken) {
      const query = new URLSearchParams();

      if (filters.isShipper !== undefined) {
        query.set('isShipper', String(filters.isShipper));
      }

      if (filters.isConsignee !== undefined) {
        query.set('isConsignee', String(filters.isConsignee));
      }

      if (filters.isAgent !== undefined) {
        query.set('isAgent', String(filters.isAgent));
      }

      const search = query.size > 0 ? `?${query.toString()}` : '';

      return apiRequest<OrganizationSummary[]>(
        `/api/v1/internal/organizations${search}`,
        {
          accessToken
        },
        config
      );
    },
    createOrganization(payload, accessToken) {
      return apiRequest<OrganizationSummary>(
        '/api/v1/internal/organizations',
        {
          method: 'POST',
          body: payload,
          accessToken
        },
        config
      );
    },
    createBooking(payload, accessToken) {
      return apiRequest<BookingSummary>(
        '/api/v1/internal/bookings',
        {
          method: 'POST',
          body: payload,
          accessToken
        },
        config
      );
    },
    updateOrganization(organizationId, payload, accessToken) {
      return apiRequest<OrganizationSummary>(
        `/api/v1/internal/organizations/${organizationId}`,
        {
          method: 'PATCH',
          body: payload,
          accessToken
        },
        config
      );
    },
    updateBooking(bookingId, payload, accessToken) {
      return apiRequest<BookingSummary>(
        `/api/v1/internal/bookings/${bookingId}`,
        {
          method: 'PATCH',
          body: payload,
          accessToken
        },
        config
      );
    },
    getBooking(bookingId, accessToken) {
      return apiRequest<BookingDetails>(
        `/api/v1/internal/bookings/${bookingId}`,
        {
          accessToken
        },
        config
      );
    },
    listBookings(filters, accessToken) {
      const query = new URLSearchParams();

      if (filters.status !== undefined) {
        query.set('status', filters.status);
      }

      if (filters.page !== undefined) {
        query.set('page', String(filters.page));
      }

      if (filters.limit !== undefined) {
        query.set('limit', String(filters.limit));
      }

      const search = query.size > 0 ? `?${query.toString()}` : '';

      return apiRequest<BookingDraftListItem[]>(
        `/api/v1/internal/bookings${search}`,
        {
          accessToken
        },
        config
      );
    },
    listParties(filters, accessToken) {
      const query = new URLSearchParams();

      if (filters.search !== undefined && filters.search.length > 0) {
        query.set('search', filters.search);
      }

      if (filters.page !== undefined) {
        query.set('page', String(filters.page));
      }

      if (filters.limit !== undefined) {
        query.set('limit', String(filters.limit));
      }

      const search = query.size > 0 ? `?${query.toString()}` : '';

      return apiRequest<BookingLookupParty[]>(
        `/api/v1/internal/parties${search}`,
        {
          accessToken
        },
        config
      );
    },
    listPorts(filters, accessToken) {
      const query = new URLSearchParams();

      if (filters.search !== undefined && filters.search.length > 0) {
        query.set('search', filters.search);
      }

      if (filters.mode !== undefined) {
        query.set('mode', filters.mode);
      }

      if (filters.page !== undefined) {
        query.set('page', String(filters.page));
      }

      if (filters.limit !== undefined) {
        query.set('limit', String(filters.limit));
      }

      const search = query.size > 0 ? `?${query.toString()}` : '';

      return apiRequest<BookingLookupPort[]>(
        `/api/v1/internal/ports${search}`,
        {
          accessToken
        },
        config
      );
    },
    importBookingPoFile(formData, accessToken) {
      return apiRequest<BookingPoImportResponseData>(
        '/api/v1/internal/bookings/po-import',
        {
          method: 'POST',
          body: formData,
          accessToken
        },
        config
      );
    },
    async deleteOrganization(organizationId, accessToken) {
      await apiRequest<undefined>(
        `/api/v1/internal/organizations/${organizationId}`,
        {
          method: 'DELETE',
          accessToken
        },
        config
      );
    },
    listOrganizationRelationships(organizationId, accessToken) {
      return apiRequest<OrganizationRelationshipSummary[]>(
        `/api/v1/internal/organizations/${organizationId}/relationships`,
        {
          accessToken
        },
        config
      );
    },
    createOrganizationRelationship(organizationId, payload, accessToken) {
      return apiRequest<OrganizationRelationshipSummary>(
        `/api/v1/internal/organizations/${organizationId}/relationships`,
        {
          method: 'POST',
          body: payload,
          accessToken
        },
        config
      );
    },
    async deleteOrganizationRelationship(
      organizationId,
      relationshipId,
      accessToken
    ) {
      await apiRequest<undefined>(
        `/api/v1/internal/organizations/${organizationId}/relationships/${relationshipId}`,
        {
          method: 'DELETE',
          accessToken
        },
        config
      );
    },
    listOrganizationUsers(organizationId, accessToken) {
      return apiRequest<UserSummary[]>(
        `/api/v1/internal/organizations/${organizationId}/users`,
        {
          accessToken
        },
        config
      );
    },
    listAdminUsers(accessToken) {
      return apiRequest<UserSummary[]>(
        '/api/v1/internal/users/admins',
        {
          accessToken
        },
        config
      );
    },
    createUser(payload, accessToken) {
      return apiRequest<CreateUserResponseData, UserMutationMeta>(
        '/api/v1/internal/users',
        {
          method: 'POST',
          body: payload,
          accessToken
        },
        config
      );
    },
    updateUser(userId, payload, accessToken) {
      return apiRequest<UserSummary, UserMutationMeta>(
        `/api/v1/internal/users/${userId}`,
        {
          method: 'PATCH',
          body: payload,
          accessToken
        },
        config
      );
    },
    async deleteUser(userId, accessToken) {
      await apiRequest<undefined>(
        `/api/v1/internal/users/${userId}`,
        {
          method: 'DELETE',
          accessToken
        },
        config
      );
    },
    changeUserPassword(userId, payload, accessToken) {
      return apiRequest<{ success: true }>(
        `/api/v1/internal/users/${userId}/password`,
        {
          method: 'PATCH',
          body: payload,
          accessToken
        },
        config
      );
    }
  };
}

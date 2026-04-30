import type {
  ApiSuccessResponse,
  ChangeUserPasswordPayload,
  CreateUserResponseData,
  OrganizationListFilters,
  OrganizationPayload,
  OrganizationRelationshipPayload,
  OrganizationRelationshipSummary,
  OrganizationSummary,
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
  updateOrganization(
    organizationId: string,
    payload: Partial<OrganizationPayload>,
    accessToken: string
  ): Promise<ApiSuccessResponse<OrganizationSummary>>;
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

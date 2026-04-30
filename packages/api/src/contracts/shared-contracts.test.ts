import { describe, expect, it } from '@jest/globals';
import {
  ROLE_NAMES,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type AuthenticatedUserSummary,
  type LoginRequest,
  type LoginResponseData,
  type OrganizationSummary,
  type UserSummary
} from '@ebooking-cx/shared';

describe('shared contracts', () => {
  it('exports the auth, organization, user, and response contract surface', () => {
    const user: AuthenticatedUserSummary = {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      organizationId: null,
      roles: ['admin']
    };

    const loginRequest: LoginRequest = {
      email: 'admin@example.com',
      password: 'secret'
    };

    const loginResponse: ApiSuccessResponse<LoginResponseData> = {
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user
      }
    };

    const organization: OrganizationSummary = {
      id: 'org-1',
      name: 'Kuafu',
      code: 'KUA',
      cwCode: null,
      isShipper: true,
      isConsignee: false,
      isAgent: false,
      origin: null,
      address1: null,
      address2: null,
      address3: null,
      address4: null,
      city: null,
      postal: null,
      country: null,
      createdAt: '2026-04-30T00:00:00.000Z',
      updatedAt: '2026-04-30T00:00:00.000Z'
    };

    const accountUser: UserSummary = {
      id: 'user-2',
      email: 'user@example.com',
      name: 'Mikey',
      phone: null,
      isDisabled: false,
      organizationId: organization.id,
      roles: ['shipper'],
      createdAt: '2026-04-30T00:00:00.000Z',
      updatedAt: '2026-04-30T00:00:00.000Z'
    };

    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'SHIPMENT_NOT_FOUND',
        message: 'No shipment found with the given ID.',
        statusCode: 404
      }
    };

    expect(ROLE_NAMES).toEqual(['admin', 'shipper', 'consignee', 'agent']);
    expect(loginRequest.email).toBe('admin@example.com');
    expect(loginResponse.data.user).toEqual(user);
    expect(accountUser.roles).toEqual(['shipper']);
    expect(errorResponse.error.statusCode).toBe(404);
  });
});

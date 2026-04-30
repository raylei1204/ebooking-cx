import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ApiSuccessResponse,
  CreateUserResponseData,
  OrganizationRelationshipSummary,
  OrganizationSummary,
  UserMutationMeta,
  UserSummary
} from '@ebooking-cx/shared';

import OrganizationManagementPage from './OrganizationManagementPage.vue';
import {
  adminApiClientKey,
  type AdminApiClient
} from '@/services/api/internal-admin';
import { useAuthStore } from '@/stores/auth';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

function createOrganization(
  overrides: Partial<OrganizationSummary> = {}
): OrganizationSummary {
  return {
    id: 'org-1',
    name: 'Kuafu International',
    code: 'KUAFU',
    cwCode: 'KUAINTPVG',
    isShipper: true,
    isConsignee: false,
    isAgent: false,
    origin: 'PVG',
    address1: 'Unit 305',
    address2: null,
    address3: null,
    address4: null,
    city: 'Shanghai',
    postal: '200000',
    country: 'CN',
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
    ...overrides
  };
}

function createUser(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    phone: null,
    isDisabled: false,
    organizationId: null,
    roles: ['admin'],
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
    ...overrides
  };
}

function createRelationship(
  overrides: Partial<OrganizationRelationshipSummary> = {}
): OrganizationRelationshipSummary {
  return {
    id: 'rel-1',
    label: 'Preferred agent',
    relatedOrganization: createOrganization({
      id: 'org-2',
      name: 'Atlas Logistics',
      isAgent: true,
      isShipper: false
    }),
    ...overrides
  };
}

function createAdminApiClientMock(
  overrides: Partial<AdminApiClient> = {}
): AdminApiClient {
  return {
    listOrganizations: vi.fn().mockResolvedValue({
      data: [createOrganization()]
    } satisfies ApiSuccessResponse<OrganizationSummary[]>),
    createOrganization: vi.fn().mockResolvedValue({
      data: createOrganization()
    } satisfies ApiSuccessResponse<OrganizationSummary>),
    updateOrganization: vi.fn().mockResolvedValue({
      data: createOrganization()
    } satisfies ApiSuccessResponse<OrganizationSummary>),
    deleteOrganization: vi.fn().mockResolvedValue(undefined),
    listOrganizationRelationships: vi.fn().mockResolvedValue({
      data: [createRelationship()]
    } satisfies ApiSuccessResponse<OrganizationRelationshipSummary[]>),
    createOrganizationRelationship: vi.fn().mockResolvedValue({
      data: createRelationship()
    } satisfies ApiSuccessResponse<OrganizationRelationshipSummary>),
    deleteOrganizationRelationship: vi.fn().mockResolvedValue(undefined),
    listOrganizationUsers: vi.fn().mockResolvedValue({
      data: [
        createUser({
          id: 'user-2',
          organizationId: 'org-1',
          roles: ['shipper'],
          email: 'ops@kuafu.example'
        })
      ]
    } satisfies ApiSuccessResponse<UserSummary[]>),
    listAdminUsers: vi.fn().mockResolvedValue({
      data: [createUser()]
    } satisfies ApiSuccessResponse<UserSummary[]>),
    createUser: vi.fn().mockResolvedValue({
      data: {
        user: createUser({
          id: 'user-3',
          organizationId: 'org-1',
          roles: ['shipper']
        }),
        temporaryPassword: '123456'
      },
      meta: {
        warnings: []
      }
    } satisfies ApiSuccessResponse<CreateUserResponseData, UserMutationMeta>),
    updateUser: vi.fn().mockResolvedValue({
      data: createUser(),
      meta: {
        warnings: []
      }
    } satisfies ApiSuccessResponse<UserSummary, UserMutationMeta>),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    changeUserPassword: vi.fn().mockResolvedValue({
      data: {
        success: true
      }
    }),
    ...overrides
  };
}

async function mountPage(apiClient: AdminApiClient) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore();
  authStore.accessToken = 'access-token';
  authStore.refreshToken = 'refresh-token';
  authStore.currentUser = createUser({
    organizationId: null,
    roles: ['admin']
  });

  const wrapper = mount(OrganizationManagementPage, {
    global: {
      plugins: [pinia, ElementPlus],
      provide: {
        [adminApiClientKey as symbol]: apiClient
      },
      stubs: {
        teleport: true,
        transition: false
      }
    }
  });

  await flushPromises();

  return wrapper;
}

describe('OrganizationManagementPage', () => {
  beforeEach(() => {
    vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never);
    vi
      .spyOn(ElMessageBox, 'confirm')
      .mockImplementation(async () => undefined as never);
  });

  it('renders shipper organizations first and loads selected organization users', async () => {
    const apiClient = createAdminApiClientMock();
    const wrapper = await mountPage(apiClient);

    expect(apiClient.listOrganizations).toHaveBeenCalledWith(
      { isShipper: true },
      'access-token'
    );
    expect(apiClient.listOrganizationUsers).toHaveBeenCalledWith(
      'org-1',
      'access-token'
    );
    expect(wrapper.text()).toContain('Shipper');
    expect(wrapper.text()).toContain('Kuafu International');
    expect(wrapper.text()).toContain('ops@kuafu.example');
  });

  it('disables admin user edit and delete actions until an admin row is selected', async () => {
    const apiClient = createAdminApiClientMock();
    const wrapper = await mountPage(apiClient);

    const adminTab = wrapper
      .findAll('.el-tabs__item')
      .find((item) => item.text().includes('Admin user'));

    expect(adminTab).toBeDefined();

    await adminTab!.trigger('click');
    await flushPromises();

    expect(apiClient.listAdminUsers).toHaveBeenCalledWith('access-token');
    expect(
      wrapper.get('[data-testid="admin-edit-button"]').attributes('disabled')
    ).toBeDefined();
    expect(
      wrapper.get('[data-testid="admin-delete-button"]').attributes('disabled')
    ).toBeDefined();
  });

  it('blocks organization save when no organization type is selected', async () => {
    const apiClient = createAdminApiClientMock();
    const wrapper = await mountPage(apiClient);
    const vm = wrapper.vm as unknown as {
      openCreateOrganizationDialog: () => Promise<void>;
      saveOrganization: () => Promise<void>;
      organizationForm: {
        name: string;
        isShipper: boolean;
        isConsignee: boolean;
        isAgent: boolean;
      };
      organizationTypeError: string;
    };

    await vm.openCreateOrganizationDialog();
    vm.organizationForm.name = 'New Org';
    vm.organizationForm.isShipper = false;
    vm.organizationForm.isConsignee = false;
    vm.organizationForm.isAgent = false;
    await vm.saveOrganization();
    await flushPromises();

    expect(apiClient.createOrganization).not.toHaveBeenCalled();
    expect(vm.organizationTypeError).toBe(
      'At least one organization type must be selected.'
    );
  });

  it('shows the backend conflict error when deleting an organization with users', async () => {
    const apiClient = createAdminApiClientMock({
      deleteOrganization: vi.fn().mockRejectedValue({
        statusCode: 409,
        message: 'Cannot delete organization with existing users.'
      })
    });
    const wrapper = await mountPage(apiClient);

    await wrapper.get('[data-testid="delete-organization-button"]').trigger('click');
    await flushPromises();

    expect(apiClient.deleteOrganization).toHaveBeenCalledWith(
      'org-1',
      'access-token'
    );
    expect(ElMessage.error).toHaveBeenCalledWith(
      'Cannot delete organization with existing users.'
    );
    expect(wrapper.text()).toContain('Kuafu International');
  });
});

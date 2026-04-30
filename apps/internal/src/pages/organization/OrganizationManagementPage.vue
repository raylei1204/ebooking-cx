<script setup lang="ts">
import {
  Delete,
  EditPen,
  Key,
  Plus,
  RefreshRight
} from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, inject, onMounted, reactive, ref, watch } from 'vue';
import type {
  OrganizationListFilters,
  OrganizationPayload,
  OrganizationRelationshipSummary,
  OrganizationSummary,
  RoleName,
  UserPayload,
  UserSummary
} from '@ebooking-cx/shared';

import {
  adminApiClientKey,
  createAdminApiClient,
  type AdminApiClient
} from '@/services/api/internal-admin';
import type { ApiClientError } from '@/services/api/types';
import { useAuthStore } from '@/stores/auth';

type MainTabKey = 'shipper' | 'consignee' | 'agent' | 'admin';
type OrganizationTabKey = 'shipper' | 'consignee' | 'agent';

interface PagedState<TItem> {
  items: TItem[];
  isLoading: boolean;
  errorMessage: string | null;
  page: number;
  pageSize: number;
  selectedId: string | null;
  hasLoaded: boolean;
}

interface OrganizationDialogModel extends OrganizationPayload {
  id?: string;
}

interface UserDialogModel extends UserPayload {}

interface RelationshipFormModel {
  organizationId: string | null;
  label: string;
}

interface PasswordDialogModel {
  password: string;
  confirmPassword: string;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const ORGANIZATION_TAB_FILTERS: Record<OrganizationTabKey, OrganizationListFilters> =
  {
    shipper: { isShipper: true },
    consignee: { isConsignee: true },
    agent: { isAgent: true }
  };
const ROLE_OPTIONS: Array<{ value: RoleName; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'shipper', label: 'Shipper' },
  { value: 'consignee', label: 'Consignee' },
  { value: 'agent', label: 'Agent' }
];

const authStore = useAuthStore();
const apiClient = inject<AdminApiClient>(
  adminApiClientKey,
  createAdminApiClient()
);

const activeTab = ref<MainTabKey>('shipper');

const organizationLists = reactive<Record<OrganizationTabKey, PagedState<OrganizationSummary>>>({
  shipper: createPagedState<OrganizationSummary>(),
  consignee: createPagedState<OrganizationSummary>(),
  agent: createPagedState<OrganizationSummary>()
});

const organizationUsers = reactive<PagedState<UserSummary>>(createPagedState<UserSummary>());
const adminUsers = reactive<PagedState<UserSummary>>(createPagedState<UserSummary>());

const organizationDialogVisible = ref(false);
const organizationDialogMode = ref<'create' | 'edit'>('create');
const organizationDialogTab = ref<'details' | 'relationships'>('details');
const organizationDialogSaving = ref(false);
const organizationDialogFormRef = ref<FormInstance>();
const organizationTypeError = ref('');
const organizationRelationships = ref<OrganizationRelationshipSummary[]>([]);
const organizationRelationshipsLoading = ref(false);
const organizationRelationshipsError = ref<string | null>(null);
const relationshipOptionsLoading = ref(false);
const relationshipForm = reactive<RelationshipFormModel>({
  organizationId: null,
  label: ''
});
const organizationForm = reactive<OrganizationDialogModel>(createEmptyOrganizationForm());

const userDialogVisible = ref(false);
const userDialogMode = ref<'create' | 'edit'>('create');
const userDialogTab = ref<'details' | 'permission'>('details');
const userDialogSaving = ref(false);
const userDialogFormRef = ref<FormInstance>();
const userForm = reactive<UserDialogModel>(createEmptyUserForm());

const passwordDialogVisible = ref(false);
const passwordDialogSaving = ref(false);
const passwordDialogFormRef = ref<FormInstance>();
const passwordForm = reactive<PasswordDialogModel>({
  password: '',
  confirmPassword: ''
});

const allOrganizationsCache = ref<OrganizationSummary[] | null>(null);

const organizationRules: FormRules<OrganizationDialogModel> = {
  name: [
    {
      required: true,
      message: 'Organization name is required.',
      trigger: 'blur'
    }
  ]
};

const userRules: FormRules<UserDialogModel> = {
  email: [
    {
      required: true,
      message: 'Email is required.',
      trigger: 'blur'
    },
    {
      type: 'email',
      message: 'Enter a valid email address.',
      trigger: 'blur'
    }
  ],
  name: [
    {
      required: true,
      message: 'User name is required.',
      trigger: 'blur'
    }
  ],
  roles: [
    {
      type: 'array',
      required: true,
      min: 1,
      message: 'At least one role must be assigned.',
      trigger: 'change'
    }
  ]
};

const passwordRules: FormRules<PasswordDialogModel> = {
  password: [
    {
      required: true,
      message: 'Password is required.',
      trigger: 'blur'
    },
    {
      min: 6,
      message: 'Password must be at least 6 characters.',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    {
      required: true,
      message: 'Please confirm the password.',
      trigger: 'blur'
    },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== passwordForm.password) {
          callback(new Error('Passwords do not match.'));
          return;
        }

        callback();
      },
      trigger: 'blur'
    }
  ]
};

const currentOrganizationState = computed(() =>
  activeTab.value === 'admin'
    ? null
    : organizationLists[activeTab.value as OrganizationTabKey]
);

const selectedOrganization = computed<OrganizationSummary | null>(() => {
  const state = currentOrganizationState.value;

  if (state === null) {
    return null;
  }

  return state.items.find((item) => item.id === state.selectedId) ?? null;
});

const selectedOrganizationUsers = computed(() =>
  slicePage(organizationUsers.items, organizationUsers.page, organizationUsers.pageSize)
);
const selectedAdminUsers = computed(() =>
  slicePage(adminUsers.items, adminUsers.page, adminUsers.pageSize)
);
const selectedOrganizations = computed(() => {
  const state = currentOrganizationState.value;

  if (state === null) {
    return [];
  }

  return slicePage(state.items, state.page, state.pageSize);
});
const selectedUser = computed<UserSummary | null>(() => {
  if (activeTab.value === 'admin') {
    return adminUsers.items.find((item) => item.id === adminUsers.selectedId) ?? null;
  }

  return (
    organizationUsers.items.find((item) => item.id === organizationUsers.selectedId) ?? null
  );
});
const isOrganizationTab = computed(() => activeTab.value !== 'admin');
const relationshipOptions = computed(() => {
  const selectedId = organizationDialogMode.value === 'edit' ? organizationForm.id : null;

  return (allOrganizationsCache.value ?? []).filter(
    (organization) => organization.id !== selectedId
  );
});
const canEditOrganization = computed(
  () => selectedOrganization.value !== null && isOrganizationTab.value
);
const canDeleteOrganization = computed(
  () => selectedOrganization.value !== null && isOrganizationTab.value
);
const canEditUser = computed(() => selectedUser.value !== null);
const canDeleteUser = computed(() => selectedUser.value !== null);
const canChangePassword = computed(() => selectedUser.value !== null);

watch(activeTab, async (tab) => {
  if (tab === 'admin') {
    if (!adminUsers.hasLoaded) {
      await loadAdminUsers();
    }

    return;
  }

  await loadOrganizations(tab);
});

watch(
  () => currentOrganizationState.value?.selectedId,
  async (selectedId, previousSelectedId) => {
    if (
      activeTab.value === 'admin' ||
      selectedId === null ||
      selectedId === previousSelectedId
    ) {
      if (selectedId === null) {
        organizationUsers.items = [];
        organizationUsers.selectedId = null;
      }

      return;
    }

    await loadOrganizationUsers(selectedId);
  }
);

onMounted(async () => {
  await loadOrganizations('shipper');
});

function createPagedState<TItem>(): PagedState<TItem> {
  return {
    items: [],
    isLoading: false,
    errorMessage: null,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    selectedId: null,
    hasLoaded: false
  };
}

function createEmptyOrganizationForm(): OrganizationDialogModel {
  return {
    name: '',
    code: null,
    cwCode: null,
    isShipper: activeTab.value === 'shipper',
    isConsignee: activeTab.value === 'consignee',
    isAgent: activeTab.value === 'agent',
    origin: null,
    address1: null,
    address2: null,
    address3: null,
    address4: null,
    city: null,
    postal: null,
    country: null
  };
}

function createEmptyUserForm(): UserDialogModel {
  const organizationId =
    activeTab.value === 'admin'
      ? null
      : organizationLists[activeTab.value as OrganizationTabKey].selectedId;

  return {
    email: '',
    name: '',
    phone: null,
    isDisabled: false,
    organizationId,
    roles: activeTab.value === 'admin' ? ['admin'] : []
  };
}

function slicePage<TItem>(items: TItem[], page: number, pageSize: number): TItem[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function readAccessToken(): string {
  return authStore.accessToken ?? '';
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  const apiError = error as Partial<ApiClientError> | undefined;
  return apiError?.message ?? fallbackMessage;
}

function showWarnings(warnings: Array<{ message: string }> | undefined): void {
  if (warnings === undefined || warnings.length === 0) {
    return;
  }

  warnings.forEach((warning) => {
    ElMessage.warning(warning.message);
  });
}

function toNullableText(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function loadOrganizations(tab: OrganizationTabKey, force = false): Promise<void> {
  const state = organizationLists[tab];

  if (state.hasLoaded && !force) {
    return;
  }

  state.isLoading = true;
  state.errorMessage = null;

  try {
    const response = await apiClient.listOrganizations(
      ORGANIZATION_TAB_FILTERS[tab],
      readAccessToken()
    );

    state.items = response.data;
    state.hasLoaded = true;
    state.page = 1;

    if (
      state.selectedId === null ||
      state.items.every((item) => item.id !== state.selectedId)
    ) {
      state.selectedId = state.items[0]?.id ?? null;
    }

  } catch (error) {
    state.errorMessage = getApiErrorMessage(
      error,
      'Unable to load organizations.'
    );
  } finally {
    state.isLoading = false;
  }
}

async function loadOrganizationUsers(
  organizationId: string,
  force = true
): Promise<void> {
  if (!force && organizationUsers.items.length > 0) {
    return;
  }

  organizationUsers.isLoading = true;
  organizationUsers.errorMessage = null;

  try {
    const response = await apiClient.listOrganizationUsers(
      organizationId,
      readAccessToken()
    );

    organizationUsers.items = response.data;
    organizationUsers.hasLoaded = true;
    organizationUsers.page = 1;
    organizationUsers.selectedId = response.data[0]?.id ?? null;
  } catch (error) {
    organizationUsers.errorMessage = getApiErrorMessage(
      error,
      'Unable to load organization users.'
    );
  } finally {
    organizationUsers.isLoading = false;
  }
}

async function loadAdminUsers(force = false): Promise<void> {
  if (adminUsers.hasLoaded && !force) {
    return;
  }

  adminUsers.isLoading = true;
  adminUsers.errorMessage = null;

  try {
    const response = await apiClient.listAdminUsers(readAccessToken());

    adminUsers.items = response.data;
    adminUsers.hasLoaded = true;
    adminUsers.page = 1;
    adminUsers.selectedId = null;
  } catch (error) {
    adminUsers.errorMessage = getApiErrorMessage(
      error,
      'Unable to load admin users.'
    );
  } finally {
    adminUsers.isLoading = false;
  }
}

async function refreshActiveData(): Promise<void> {
  if (activeTab.value === 'admin') {
    await loadAdminUsers(true);
    return;
  }

  await loadOrganizations(activeTab.value, true);
}

function selectOrganization(organization: OrganizationSummary): void {
  const state = currentOrganizationState.value;

  if (state === null) {
    return;
  }

  state.selectedId = organization.id;
}

function selectOrganizationUser(user: UserSummary): void {
  organizationUsers.selectedId = user.id;
}

function selectAdminUser(user: UserSummary): void {
  adminUsers.selectedId = user.id;
}

function resetOrganizationForm(): void {
  Object.assign(organizationForm, createEmptyOrganizationForm());
  organizationTypeError.value = '';
}

function resetRelationshipState(): void {
  organizationRelationships.value = [];
  organizationRelationshipsError.value = null;
  relationshipForm.organizationId = null;
  relationshipForm.label = '';
}

async function openCreateOrganizationDialog(): Promise<void> {
  organizationDialogMode.value = 'create';
  organizationDialogTab.value = 'details';
  resetOrganizationForm();
  resetRelationshipState();
  organizationDialogVisible.value = true;
  await organizationDialogFormRef.value?.clearValidate();
}

async function openEditOrganizationDialog(
  organization = selectedOrganization.value
): Promise<void> {
  if (organization === null) {
    return;
  }

  organizationDialogMode.value = 'edit';
  organizationDialogTab.value = 'details';
  Object.assign(organizationForm, {
    id: organization.id,
    name: organization.name,
    code: organization.code,
    cwCode: organization.cwCode,
    isShipper: organization.isShipper,
    isConsignee: organization.isConsignee,
    isAgent: organization.isAgent,
    origin: organization.origin,
    address1: organization.address1,
    address2: organization.address2,
    address3: organization.address3,
    address4: organization.address4,
    city: organization.city,
    postal: organization.postal,
    country: organization.country
  });
  organizationTypeError.value = '';
  organizationDialogVisible.value = true;
  await ensureRelationshipOptionsLoaded();
  await loadOrganizationRelationships(organization.id);
  await organizationDialogFormRef.value?.clearValidate();
}

async function saveOrganization(): Promise<void> {
  const isValid =
    organizationDialogFormRef.value === undefined
      ? true
      : await organizationDialogFormRef.value.validate().catch(() => false);

  if (!isValid) {
    return;
  }

  if (
    !organizationForm.isShipper &&
    !organizationForm.isConsignee &&
    !organizationForm.isAgent
  ) {
    organizationTypeError.value =
      'At least one organization type must be selected.';
    return;
  }

  organizationTypeError.value = '';
  organizationDialogSaving.value = true;

  try {
    if (organizationDialogMode.value === 'create') {
      await apiClient.createOrganization(
        normalizeOrganizationPayload(),
        readAccessToken()
      );
      ElMessage.success('Organization created.');
    } else {
      await apiClient.updateOrganization(
        organizationForm.id as string,
        normalizeOrganizationPayload(),
        readAccessToken()
      );
      ElMessage.success('Organization updated.');
    }

    organizationDialogVisible.value = false;
    allOrganizationsCache.value = null;
    await loadOrganizations(activeTab.value as OrganizationTabKey, true);
  } catch (error) {
    ElMessage.error(
      getApiErrorMessage(error, 'Unable to save organization.')
    );
  } finally {
    organizationDialogSaving.value = false;
  }
}

function normalizeOrganizationPayload(): OrganizationPayload {
  return {
    name: organizationForm.name.trim(),
    code: toNullableText(organizationForm.code),
    cwCode: toNullableText(organizationForm.cwCode),
    isShipper: organizationForm.isShipper,
    isConsignee: organizationForm.isConsignee,
    isAgent: organizationForm.isAgent,
    origin: toNullableText(organizationForm.origin),
    address1: toNullableText(organizationForm.address1),
    address2: toNullableText(organizationForm.address2),
    address3: toNullableText(organizationForm.address3),
    address4: toNullableText(organizationForm.address4),
    city: toNullableText(organizationForm.city),
    postal: toNullableText(organizationForm.postal),
    country: toNullableText(organizationForm.country)
  };
}

async function deleteSelectedOrganization(
  organization = selectedOrganization.value
): Promise<void> {
  if (organization === null) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `Delete organization "${organization.name}"?`,
      'Delete organization',
      {
        type: 'warning'
      }
    );

    await apiClient.deleteOrganization(organization.id, readAccessToken());
    ElMessage.success('Organization deleted.');
    await loadOrganizations(activeTab.value as OrganizationTabKey, true);
  } catch (error) {
    if (error === 'cancel') {
      return;
    }

    ElMessage.error(
      getApiErrorMessage(error, 'Unable to delete organization.')
    );
  }
}

async function ensureRelationshipOptionsLoaded(): Promise<void> {
  if (allOrganizationsCache.value !== null) {
    return;
  }

  relationshipOptionsLoading.value = true;

  try {
    const response = await apiClient.listOrganizations({}, readAccessToken());
    allOrganizationsCache.value = response.data;
  } catch (error) {
    ElMessage.error(
      getApiErrorMessage(
        error,
        'Unable to load organization relationship options.'
      )
    );
  } finally {
    relationshipOptionsLoading.value = false;
  }
}

async function loadOrganizationRelationships(organizationId: string): Promise<void> {
  organizationRelationshipsLoading.value = true;
  organizationRelationshipsError.value = null;

  try {
    const response = await apiClient.listOrganizationRelationships(
      organizationId,
      readAccessToken()
    );

    organizationRelationships.value = response.data;
  } catch (error) {
    organizationRelationshipsError.value = getApiErrorMessage(
      error,
      'Unable to load organization relationships.'
    );
  } finally {
    organizationRelationshipsLoading.value = false;
  }
}

async function addRelationship(): Promise<void> {
  if (
    organizationDialogMode.value !== 'edit' ||
    relationshipForm.organizationId === null
  ) {
    return;
  }

  try {
    await apiClient.createOrganizationRelationship(
      organizationForm.id as string,
      {
        organizationId: relationshipForm.organizationId,
        label: toNullableText(relationshipForm.label)
      },
      readAccessToken()
    );
    ElMessage.success('Relationship added.');
    relationshipForm.organizationId = null;
    relationshipForm.label = '';
    await loadOrganizationRelationships(organizationForm.id as string);
  } catch (error) {
    ElMessage.error(
      getApiErrorMessage(error, 'Unable to add relationship.')
    );
  }
}

async function deleteRelationship(relationship: OrganizationRelationshipSummary): Promise<void> {
  if (organizationDialogMode.value !== 'edit') {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `Remove relationship with "${relationship.relatedOrganization.name}"?`,
      'Remove relationship',
      {
        type: 'warning'
      }
    );

    await apiClient.deleteOrganizationRelationship(
      organizationForm.id as string,
      relationship.id,
      readAccessToken()
    );
    ElMessage.success('Relationship removed.');
    await loadOrganizationRelationships(organizationForm.id as string);
  } catch (error) {
    if (error === 'cancel') {
      return;
    }

    ElMessage.error(
      getApiErrorMessage(error, 'Unable to remove relationship.')
    );
  }
}

function resetUserForm(): void {
  Object.assign(userForm, createEmptyUserForm());
}

async function openCreateUserDialog(): Promise<void> {
  userDialogMode.value = 'create';
  userDialogTab.value = 'details';
  resetUserForm();
  await ensureRelationshipOptionsLoaded();
  userDialogVisible.value = true;
  await userDialogFormRef.value?.clearValidate();
}

async function openEditUserDialog(user = selectedUser.value): Promise<void> {
  if (user === null) {
    return;
  }

  userDialogMode.value = 'edit';
  userDialogTab.value = 'details';
  Object.assign(userForm, {
    email: user.email,
    name: user.name,
    phone: user.phone,
    isDisabled: user.isDisabled,
    organizationId: user.organizationId,
    roles: [...user.roles]
  });
  userDialogVisible.value = true;
  await ensureRelationshipOptionsLoaded();
  await userDialogFormRef.value?.clearValidate();
}

function handleRoleChange(nextRoles: RoleName[]): void {
  if (nextRoles.includes('admin')) {
    userForm.roles = ['admin'];
    userForm.organizationId = null;
    return;
  }

  userForm.roles = nextRoles;

  if (activeTab.value !== 'admin' && userForm.organizationId === null) {
    userForm.organizationId = selectedOrganization.value?.id ?? null;
  }
}

async function saveUser(): Promise<void> {
  const isValid =
    userDialogFormRef.value === undefined
      ? true
      : await userDialogFormRef.value.validate().catch(() => false);

  if (!isValid) {
    return;
  }

  userDialogSaving.value = true;

  try {
    const payload = normalizeUserPayload();

    if (userDialogMode.value === 'create') {
      const response = await apiClient.createUser(payload, readAccessToken());
      ElMessage.success(
        `User created. Temporary password: ${response.data.temporaryPassword}`
      );
      showWarnings(response.meta?.warnings);
    } else {
      const userId = selectedUser.value?.id;

      if (userId === undefined) {
        return;
      }

      const response = await apiClient.updateUser(
        userId,
        payload,
        readAccessToken()
      );
      ElMessage.success('User updated.');
      showWarnings(response.meta?.warnings);
    }

    userDialogVisible.value = false;
    await refreshUsersForCurrentContext();
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, 'Unable to save user.'));
  } finally {
    userDialogSaving.value = false;
  }
}

function normalizeUserPayload(): UserPayload {
  const roles = [...userForm.roles];
  const isAdminOnly = roles.includes('admin');

  return {
    email: userForm.email.trim(),
    name: userForm.name.trim(),
    phone: toNullableText(userForm.phone),
    isDisabled: userForm.isDisabled,
    organizationId: isAdminOnly ? null : userForm.organizationId,
    roles
  };
}

async function refreshUsersForCurrentContext(): Promise<void> {
  if (activeTab.value === 'admin') {
    await loadAdminUsers(true);
    return;
  }

  const organizationId = selectedOrganization.value?.id;

  if (organizationId !== undefined) {
    await loadOrganizationUsers(organizationId);
  }
}

async function deleteSelectedUser(user = selectedUser.value): Promise<void> {
  if (user === null) {
    return;
  }

  try {
    await ElMessageBox.confirm(`Delete user "${user.email}"?`, 'Delete user', {
      type: 'warning'
    });

    await apiClient.deleteUser(user.id, readAccessToken());
    ElMessage.success('User deleted.');
    await refreshUsersForCurrentContext();
  } catch (error) {
    if (error === 'cancel') {
      return;
    }

    ElMessage.error(getApiErrorMessage(error, 'Unable to delete user.'));
  }
}

async function openChangePasswordDialog(user = selectedUser.value): Promise<void> {
  if (user === null) {
    return;
  }

  passwordDialogVisible.value = true;
  passwordForm.password = '';
  passwordForm.confirmPassword = '';
  await passwordDialogFormRef.value?.clearValidate();
}

async function savePassword(): Promise<void> {
  const isValid =
    passwordDialogFormRef.value === undefined
      ? true
      : await passwordDialogFormRef.value.validate().catch(() => false);

  if (!isValid || selectedUser.value === null) {
    return;
  }

  passwordDialogSaving.value = true;

  try {
    await apiClient.changeUserPassword(
      selectedUser.value.id,
      {
        password: passwordForm.password
      },
      readAccessToken()
    );
    ElMessage.success('Password changed successfully.');
    passwordDialogVisible.value = false;
  } catch (error) {
    ElMessage.error(
      getApiErrorMessage(error, 'Unable to change password.')
    );
  } finally {
    passwordDialogSaving.value = false;
  }
}
</script>

<template>
  <section class="content-page">
    <h1 class="page-title">Organization</h1>
    <p class="content-page__subtitle">
      Manage shipper, consignee, agent organizations, related users, and admin users.
    </p>

    <div class="organization-actions">
      <template v-if="isOrganizationTab">
        <el-button
          type="primary"
          :icon="Plus"
          data-testid="create-organization-button"
          @click="openCreateOrganizationDialog"
        >
          Create organization
        </el-button>
        <el-button
          :icon="EditPen"
          :disabled="!canEditOrganization"
          @click="openEditOrganizationDialog()"
        >
          Edit organization
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!canDeleteOrganization"
          data-testid="delete-organization-button"
          @click="deleteSelectedOrganization()"
        >
          Delete organization
        </el-button>
      </template>

      <template v-else>
        <el-button type="primary" :icon="Plus" @click="openCreateUserDialog">
          Create admin user
        </el-button>
        <el-button
          :icon="EditPen"
          :disabled="!canEditUser"
          data-testid="admin-edit-button"
          @click="openEditUserDialog()"
        >
          Edit user
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!canDeleteUser"
          data-testid="admin-delete-button"
          @click="deleteSelectedUser()"
        >
          Delete user
        </el-button>
        <el-button
          :icon="Key"
          :disabled="!canChangePassword"
          @click="openChangePasswordDialog()"
        >
          Change password
        </el-button>
      </template>

      <el-button :icon="RefreshRight" @click="refreshActiveData">Refresh</el-button>
    </div>

    <div class="content-page__card organization-page__card">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="Shipper" name="shipper" />
        <el-tab-pane label="Consignee" name="consignee" />
        <el-tab-pane label="Agent" name="agent" />
        <el-tab-pane
          label="Admin user"
          name="admin"
          data-testid="organization-tab-admin"
        />
      </el-tabs>

      <div v-if="isOrganizationTab" class="organization-split-layout">
        <section
          class="organization-panel"
          v-loading="currentOrganizationState?.isLoading"
        >
          <div class="organization-panel__header">
            <h2>Organizations</h2>
          </div>

          <el-result
            v-if="currentOrganizationState?.errorMessage !== null"
            icon="error"
            title="Unable to load organizations"
            :sub-title="currentOrganizationState?.errorMessage ?? ''"
          >
            <template #extra>
              <el-button type="primary" @click="refreshActiveData">Retry</el-button>
            </template>
          </el-result>

          <el-empty
            v-else-if="selectedOrganizations.length === 0 && !currentOrganizationState?.isLoading"
            description="No organizations found"
          />

          <template v-else>
            <el-table
              :data="selectedOrganizations"
              highlight-current-row
              @row-click="selectOrganization"
            >
              <el-table-column prop="name" label="Organization" min-width="220" />
              <el-table-column prop="code" label="Code" min-width="120" />
              <el-table-column label="Type" min-width="180">
                <template #default="{ row }">
                  <div class="organization-type-tags">
                    <el-tag v-if="row.isShipper" round>Shipper</el-tag>
                    <el-tag v-if="row.isConsignee" type="success" round>
                      Consignee
                    </el-tag>
                    <el-tag v-if="row.isAgent" type="warning" round>Agent</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="" width="180" align="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click.stop="openEditOrganizationDialog(row)">
                    Edit
                  </el-button>
                  <el-button link type="danger" @click.stop="deleteSelectedOrganization(row)">
                    Delete
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="organization-pagination">
              <el-pagination
                :current-page="currentOrganizationState?.page ?? 1"
                :page-size="currentOrganizationState?.pageSize ?? 10"
                :page-sizes="PAGE_SIZE_OPTIONS"
                layout="total, sizes, prev, pager, next"
                :total="currentOrganizationState?.items.length ?? 0"
                @current-change="
                  (page) => {
                    if (currentOrganizationState) currentOrganizationState.page = page;
                  }
                "
                @size-change="
                  (size) => {
                    if (currentOrganizationState) {
                      currentOrganizationState.pageSize = size;
                      currentOrganizationState.page = 1;
                    }
                  }
                "
              />
            </div>
          </template>
        </section>

        <section class="organization-panel" v-loading="organizationUsers.isLoading">
          <div class="organization-panel__header">
            <h2>Users</h2>
            <div class="organization-panel__actions">
              <el-button
                type="primary"
                :icon="Plus"
                :disabled="selectedOrganization === null"
                @click="openCreateUserDialog"
              >
                Create user
              </el-button>
              <el-button
                :icon="EditPen"
                :disabled="!canEditUser"
                @click="openEditUserDialog()"
              >
                Edit user
              </el-button>
              <el-button
                type="danger"
                :icon="Delete"
                :disabled="!canDeleteUser"
                @click="deleteSelectedUser()"
              >
                Delete user
              </el-button>
              <el-button
                :icon="Key"
                :disabled="!canChangePassword"
                @click="openChangePasswordDialog()"
              >
                Change password
              </el-button>
            </div>
          </div>

          <el-result
            v-if="organizationUsers.errorMessage !== null"
            icon="error"
            title="Unable to load users"
            :sub-title="organizationUsers.errorMessage"
          >
            <template #extra>
              <el-button
                type="primary"
                :disabled="selectedOrganization === null"
                @click="
                  () => {
                    if (selectedOrganization) loadOrganizationUsers(selectedOrganization.id);
                  }
                "
              >
                Retry
              </el-button>
            </template>
          </el-result>

          <el-empty
            v-else-if="selectedOrganization === null"
            description="Select an organization to view users"
          />

          <el-empty
            v-else-if="selectedOrganizationUsers.length === 0 && !organizationUsers.isLoading"
            description="No users found"
          />

          <template v-else>
            <el-table
              :data="selectedOrganizationUsers"
              highlight-current-row
              @row-click="selectOrganizationUser"
            >
              <el-table-column prop="name" label="Name" min-width="160" />
              <el-table-column prop="email" label="Email" min-width="220" />
              <el-table-column label="Status" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.isDisabled ? 'info' : 'success'" round>
                    {{ row.isDisabled ? 'Disabled' : 'Active' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Roles" min-width="180">
                <template #default="{ row }">
                  {{ row.roles.join(', ') }}
                </template>
              </el-table-column>
              <el-table-column label="" width="220" align="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click.stop="openEditUserDialog(row)">
                    Edit
                  </el-button>
                  <el-button link @click.stop="openChangePasswordDialog(row)">
                    Password
                  </el-button>
                  <el-button link type="danger" @click.stop="deleteSelectedUser(row)">
                    Delete
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="organization-pagination">
              <el-pagination
                :current-page="organizationUsers.page"
                :page-size="organizationUsers.pageSize"
                :page-sizes="PAGE_SIZE_OPTIONS"
                layout="total, sizes, prev, pager, next"
                :total="organizationUsers.items.length"
                @current-change="(page) => (organizationUsers.page = page)"
                @size-change="
                  (size) => {
                    organizationUsers.pageSize = size;
                    organizationUsers.page = 1;
                  }
                "
              />
            </div>
          </template>
        </section>
      </div>

      <section v-else class="organization-panel" v-loading="adminUsers.isLoading">
        <div class="organization-panel__header">
          <h2>Admin users</h2>
        </div>

        <el-result
          v-if="adminUsers.errorMessage !== null"
          icon="error"
          title="Unable to load admin users"
          :sub-title="adminUsers.errorMessage"
        >
          <template #extra>
            <el-button type="primary" @click="loadAdminUsers(true)">Retry</el-button>
          </template>
        </el-result>

        <el-empty
          v-else-if="selectedAdminUsers.length === 0 && !adminUsers.isLoading"
          description="No admin users found"
        />

        <template v-else>
          <el-table
            :data="selectedAdminUsers"
            highlight-current-row
            @row-click="selectAdminUser"
          >
            <el-table-column prop="name" label="Name" min-width="160" />
            <el-table-column prop="email" label="Email" min-width="240" />
            <el-table-column label="Status" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isDisabled ? 'info' : 'success'" round>
                  {{ row.isDisabled ? 'Disabled' : 'Active' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="" width="220" align="right">
              <template #default="{ row }">
                <el-button link type="primary" @click.stop="openEditUserDialog(row)">
                  Edit
                </el-button>
                <el-button link @click.stop="openChangePasswordDialog(row)">
                  Password
                </el-button>
                <el-button link type="danger" @click.stop="deleteSelectedUser(row)">
                  Delete
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="organization-pagination">
            <el-pagination
              :current-page="adminUsers.page"
              :page-size="adminUsers.pageSize"
              :page-sizes="PAGE_SIZE_OPTIONS"
              layout="total, sizes, prev, pager, next"
              :total="adminUsers.items.length"
              @current-change="(page) => (adminUsers.page = page)"
              @size-change="
                (size) => {
                  adminUsers.pageSize = size;
                  adminUsers.page = 1;
                }
              "
            />
          </div>
        </template>
      </section>
    </div>

    <el-dialog
      v-model="organizationDialogVisible"
      :title="
        organizationDialogMode === 'create'
          ? 'Create organization'
          : 'Edit organization'
      "
      width="800px"
      :close-on-click-modal="false"
      :teleported="false"
    >
      <el-tabs v-model="organizationDialogTab" type="card">
        <el-tab-pane label="Details" name="details">
          <el-form
            ref="organizationDialogFormRef"
            :model="organizationForm"
            :rules="organizationRules"
            label-position="top"
          >
            <div class="organization-form-grid">
              <el-form-item label="Organization name" prop="name">
                <el-input
                  v-model="organizationForm.name"
                  name="organization-name"
                  placeholder="Enter organization name"
                />
              </el-form-item>
              <el-form-item label="Code">
                <el-input v-model="organizationForm.code" placeholder="Enter code" />
              </el-form-item>
              <el-form-item label="CargoWise code">
                <el-input
                  v-model="organizationForm.cwCode"
                  placeholder="Enter CargoWise code"
                />
              </el-form-item>
              <el-form-item label="Origin">
                <el-input v-model="organizationForm.origin" placeholder="Enter origin" />
              </el-form-item>
              <el-form-item class="organization-form-grid__full" label="Organization type">
                <el-checkbox v-model="organizationForm.isShipper">Shipper</el-checkbox>
                <el-checkbox v-model="organizationForm.isConsignee">Consignee</el-checkbox>
                <el-checkbox v-model="organizationForm.isAgent">Agent</el-checkbox>
                <p
                  v-if="organizationTypeError.length > 0"
                  class="organization-form__error"
                >
                  {{ organizationTypeError }}
                </p>
              </el-form-item>
              <el-form-item label="Address 1">
                <el-input v-model="organizationForm.address1" />
              </el-form-item>
              <el-form-item label="Address 2">
                <el-input v-model="organizationForm.address2" />
              </el-form-item>
              <el-form-item label="Address 3">
                <el-input v-model="organizationForm.address3" />
              </el-form-item>
              <el-form-item label="Address 4">
                <el-input v-model="organizationForm.address4" />
              </el-form-item>
              <el-form-item label="City">
                <el-input v-model="organizationForm.city" />
              </el-form-item>
              <el-form-item label="Postal">
                <el-input v-model="organizationForm.postal" />
              </el-form-item>
              <el-form-item label="Country">
                <el-input v-model="organizationForm.country" />
              </el-form-item>
            </div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="Relationships" name="relationships">
          <el-empty
            v-if="organizationDialogMode === 'create'"
            description="Save the organization before managing relationships"
          />

          <template v-else>
            <div class="relationship-toolbar">
              <el-select
                v-model="relationshipForm.organizationId"
                placeholder="Select related organization"
                :loading="relationshipOptionsLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="organization in relationshipOptions"
                  :key="organization.id"
                  :label="organization.name"
                  :value="organization.id"
                />
              </el-select>
              <el-input v-model="relationshipForm.label" placeholder="Optional label" />
              <el-button
                type="primary"
                :icon="Plus"
                :disabled="relationshipForm.organizationId === null"
                @click="addRelationship"
              >
                Add relationship
              </el-button>
            </div>

            <el-result
              v-if="organizationRelationshipsError !== null"
              icon="error"
              title="Unable to load relationships"
              :sub-title="organizationRelationshipsError"
            >
              <template #extra>
                <el-button
                  type="primary"
                  @click="loadOrganizationRelationships(organizationForm.id as string)"
                >
                  Retry
                </el-button>
              </template>
            </el-result>

            <el-empty
              v-else-if="
                organizationRelationships.length === 0 &&
                !organizationRelationshipsLoading
              "
              description="No related organizations"
            />

            <el-table
              v-else
              v-loading="organizationRelationshipsLoading"
              :data="organizationRelationships"
            >
              <el-table-column
                prop="relatedOrganization.name"
                label="Related organization"
                min-width="220"
              />
              <el-table-column prop="label" label="Label" min-width="160" />
              <el-table-column label="" width="140" align="right">
                <template #default="{ row }">
                  <el-button
                    link
                    type="danger"
                    @click="deleteRelationship(row)"
                  >
                    Remove
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="organizationDialogVisible = false">Cancel</el-button>
          <el-button
            type="primary"
            :loading="organizationDialogSaving"
            data-testid="organization-save-button"
            @click="saveOrganization"
          >
            Save
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="userDialogVisible"
      :title="userDialogMode === 'create' ? 'Create user' : 'Edit user'"
      width="800px"
      :close-on-click-modal="false"
      :teleported="false"
    >
      <el-tabs v-model="userDialogTab" type="card">
        <el-tab-pane label="Details" name="details">
          <el-form
            ref="userDialogFormRef"
            :model="userForm"
            :rules="userRules"
            label-position="top"
          >
            <div class="organization-form-grid">
              <el-form-item label="Email" prop="email">
                <el-input v-model="userForm.email" placeholder="user@example.com" />
              </el-form-item>
              <el-form-item label="Name" prop="name">
                <el-input v-model="userForm.name" placeholder="Enter name" />
              </el-form-item>
              <el-form-item label="Phone">
                <el-input v-model="userForm.phone" placeholder="Enter phone" />
              </el-form-item>
              <el-form-item label="Organization">
                <el-select
                  v-model="userForm.organizationId"
                  :disabled="userForm.roles.includes('admin')"
                  placeholder="Select organization"
                  style="width: 100%"
                >
                  <el-option
                    v-for="organization in allOrganizationsCache ?? []"
                    :key="organization.id"
                    :label="organization.name"
                    :value="organization.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item class="organization-form-grid__full" label="Roles" prop="roles">
                <el-checkbox-group
                  v-model="userForm.roles"
                  @change="handleRoleChange"
                >
                  <el-checkbox
                    v-for="role in ROLE_OPTIONS"
                    :key="role.value"
                    :label="role.value"
                  >
                    {{ role.label }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item class="organization-form-grid__full">
                <el-checkbox v-model="userForm.isDisabled">Disabled</el-checkbox>
              </el-form-item>
            </div>

            <p v-if="userDialogMode === 'create'" class="organization-form__hint">
              Initial password: <strong>123456</strong>
            </p>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="User Permission" name="permission">
          <el-empty description="User permission settings will be added in a later phase" />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="userDialogVisible = false">Cancel</el-button>
          <el-button type="primary" :loading="userDialogSaving" @click="saveUser">
            Save
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="passwordDialogVisible"
      title="Change password"
      width="600px"
      :close-on-click-modal="false"
      :teleported="false"
    >
      <el-form
        ref="passwordDialogFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
      >
        <el-form-item label="New password" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            show-password
            placeholder="Enter new password"
          />
        </el-form-item>
        <el-form-item label="Confirm password" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="Confirm new password"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">Cancel</el-button>
          <el-button type="primary" :loading="passwordDialogSaving" @click="savePassword">
            Save
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

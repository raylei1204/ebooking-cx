import type { RoleName } from '../auth';

export interface UserWarning {
  code: 'ROLE_ORGANIZATION_TYPE_MISMATCH';
  message: string;
}

export interface UserMutationMeta {
  warnings: UserWarning[];
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isDisabled: boolean;
  organizationId: string | null;
  roles: RoleName[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPayload {
  email: string;
  name: string;
  phone: string | null;
  isDisabled: boolean;
  organizationId: string | null;
  roles: RoleName[];
}

export interface CreateUserResponseData {
  user: UserSummary;
  temporaryPassword: string;
}

export interface ChangeUserPasswordPayload {
  password: string;
}

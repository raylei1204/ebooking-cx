import type { RoleName } from '../auth';

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

export interface ChangeUserPasswordPayload {
  password: string;
}

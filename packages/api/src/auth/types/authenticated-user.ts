import type { RoleName } from '@ebooking-cx/shared';

export interface AuthenticatedRequestUser {
  userId: string;
  email: string;
  name: string;
  organizationId: string | null;
  roles: RoleName[];
}

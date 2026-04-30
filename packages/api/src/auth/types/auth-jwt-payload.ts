import type { RoleName } from '@ebooking-cx/shared';

export type AuthTokenType = 'access' | 'refresh';

export interface AuthJwtPayload {
  sub: string;
  email: string;
  name: string;
  organizationId: string | null;
  roles: RoleName[];
  type: AuthTokenType;
  tokenId?: string;
}

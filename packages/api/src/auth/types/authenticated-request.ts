import type { Request } from 'express';

import type { AuthenticatedRequestUser } from './authenticated-user';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedRequestUser;
}

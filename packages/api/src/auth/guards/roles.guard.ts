import {
  CanActivate,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RoleName } from '@ebooking-cx/shared';

import { ROLES_KEY } from '../decorators';
import type { AuthenticatedRequest } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public canActivate(
    context: import('@nestjs/common').ExecutionContext
  ): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user === undefined) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
        statusCode: 401
      });
    }

    if (requiredRoles.some((role) => request.user?.roles.includes(role))) {
      return true;
    }

    throw new ForbiddenException({
      code: 'INSUFFICIENT_ROLE',
      message: 'You do not have permission to access this resource.',
      statusCode: 403
    });
  }
}

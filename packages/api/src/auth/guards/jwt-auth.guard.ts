import { CanActivate, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { JwtStrategy } from '../strategies';
import type { AuthenticatedRequest } from '../types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(private readonly jwtStrategy: JwtStrategy) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;
    const token = this.extractBearerToken(authorizationHeader);

    request.user = await this.jwtStrategy.validateAccessToken(token);

    return true;
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (authorizationHeader === undefined) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
        statusCode: 401
      });
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || token === undefined || token.length === 0) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
        statusCode: 401
      });
    }

    return token;
  }
}

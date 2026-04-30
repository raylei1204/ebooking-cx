import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { AuthJwtPayload, AuthenticatedRequestUser } from '../types';

@Injectable()
export class JwtStrategy {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  public async validateAccessToken(
    token: string
  ): Promise<AuthenticatedRequestUser> {
    const payload = await this.verifyToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedException({
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Invalid access token.',
        statusCode: 401
      });
    }

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      organizationId: payload.organizationId,
      roles: payload.roles
    };
  }

  private async verifyToken(token: string): Promise<AuthJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<AuthJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET')
      });
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Invalid access token.',
        statusCode: 401
      });
    }
  }
}

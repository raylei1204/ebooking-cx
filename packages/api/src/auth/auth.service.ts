import {
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type {
  AuthenticatedUserSummary,
  LoginRequest,
  LoginResponseData,
  LogoutRequest,
  RoleName,
  TokenResponseData
} from '@ebooking-cx/shared';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { hashPassword, verifyPassword } from './password';
import type { AuthJwtPayload, AuthenticatedRequestUser } from './types';

type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  public async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }

  public async verifyPassword(
    password: string,
    passwordHash: string
  ): Promise<boolean> {
    return verifyPassword(password, passwordHash);
  }

  public async login(credentials: LoginRequest): Promise<LoginResponseData> {
    const user = await this.findUserByEmail(credentials.email);

    if (user === null) {
      throw this.createInvalidCredentialsException();
    }

    if (user.isDisabled) {
      throw new ForbiddenException({
        code: 'USER_DISABLED',
        message: 'This user account is disabled.',
        statusCode: 403
      });
    }

    const isPasswordValid = await this.verifyPassword(
      credentials.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw this.createInvalidCredentialsException();
    }

    return this.issueTokenPair(user);
  }

  public async refresh(request: {
    refreshToken: string;
  }): Promise<TokenResponseData> {
    const payload = await this.verifyRefreshToken(request.refreshToken);
    const storedToken = await this.getRefreshTokenRecord(payload);

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      await this.prismaService.refreshToken.delete({
        where: {
          id: storedToken.id
        }
      });

      throw this.createInvalidRefreshTokenException();
    }

    const isTokenValid = await this.verifyPassword(
      request.refreshToken,
      storedToken.tokenHash
    );

    if (!isTokenValid) {
      throw this.createInvalidRefreshTokenException();
    }

    const user = await this.findUserById(storedToken.userId);

    if (user === null) {
      throw this.createInvalidRefreshTokenException();
    }

    if (user.isDisabled) {
      throw new ForbiddenException({
        code: 'USER_DISABLED',
        message: 'This user account is disabled.',
        statusCode: 403
      });
    }

    await this.prismaService.refreshToken.delete({
      where: {
        id: storedToken.id
      }
    });

    const nextTokenPair = await this.issueTokenPair(user);

    return {
      accessToken: nextTokenPair.accessToken,
      refreshToken: nextTokenPair.refreshToken
    };
  }

  public async logout(
    user: AuthenticatedRequestUser,
    request: LogoutRequest
  ): Promise<{ success: true }> {
    const payload = await this.verifyRefreshToken(request.refreshToken);

    if (payload.sub !== user.userId) {
      throw this.createInvalidRefreshTokenException();
    }

    const storedToken = await this.getRefreshTokenRecord(payload);
    const isTokenValid = await this.verifyPassword(
      request.refreshToken,
      storedToken.tokenHash
    );

    if (!isTokenValid) {
      throw this.createInvalidRefreshTokenException();
    }

    await this.prismaService.refreshToken.delete({
      where: {
        id: storedToken.id
      }
    });

    return {
      success: true
    };
  }

  private async issueTokenPair(
    user: UserWithRoles
  ): Promise<LoginResponseData> {
    const userSummary = this.toAuthenticatedUserSummary(user);
    const accessPayload: AuthJwtPayload = {
      sub: userSummary.id,
      email: userSummary.email,
      name: userSummary.name,
      organizationId: userSummary.organizationId,
      roles: userSummary.roles,
      type: 'access'
    };
    const refreshTokenId = randomUUID();
    const refreshPayload: AuthJwtPayload = {
      ...accessPayload,
      type: 'refresh',
      tokenId: refreshTokenId
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.getLifetimeInSeconds(
          this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRY')
        )
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.getLifetimeInSeconds(
          this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRY')
        )
      })
    ]);

    await this.prismaService.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        tokenHash: await this.hashPassword(refreshToken),
        expiresAt: this.createExpiryDate(
          this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRY')
        )
      }
    });

    return {
      accessToken,
      refreshToken,
      user: userSummary
    };
  }

  private async findUserByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prismaService.user.findUnique({
      where: {
        email
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  private async findUserById(userId: string): Promise<UserWithRoles | null> {
    return this.prismaService.user.findUnique({
      where: {
        id: userId
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  private toAuthenticatedUserSummary(
    user: UserWithRoles
  ): AuthenticatedUserSummary {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      roles: user.userRoles.map(({ role }) => role.name as RoleName)
    };
  }

  private async verifyRefreshToken(token: string): Promise<AuthJwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET')
      });

      if (payload.type !== 'refresh' || payload.tokenId === undefined) {
        throw new Error('Refresh token payload is invalid.');
      }

      return payload;
    } catch {
      throw this.createInvalidRefreshTokenException();
    }
  }

  private async getRefreshTokenRecord(
    payload: AuthJwtPayload
  ): Promise<RefreshTokenRecord> {
    if (payload.tokenId === undefined) {
      throw this.createInvalidRefreshTokenException();
    }

    const storedToken = await this.prismaService.refreshToken.findUnique({
      where: {
        id: payload.tokenId
      }
    });

    if (storedToken === null || storedToken.userId !== payload.sub) {
      throw this.createInvalidRefreshTokenException();
    }

    return storedToken;
  }

  private createExpiryDate(lifetime: string): Date {
    return new Date(Date.now() + this.getLifetimeInSeconds(lifetime) * 1_000);
  }

  private getLifetimeInSeconds(lifetime: string): number {
    const matchedLifetime = /^(\d+)([smhd])$/.exec(lifetime);

    if (matchedLifetime === null) {
      throw new Error(`Unsupported JWT lifetime format: ${lifetime}`);
    }

    const amount = Number(matchedLifetime[1]);
    const unit = matchedLifetime[2] as 's' | 'm' | 'h' | 'd';
    const unitMultipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1,
      m: 60,
      h: 3_600,
      d: 86_400
    };

    return amount * unitMultipliers[unit];
  }

  private createInvalidCredentialsException(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
      statusCode: 401
    });
  }

  private createInvalidRefreshTokenException(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid refresh token.',
      statusCode: 401
    });
  }
}

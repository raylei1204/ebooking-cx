import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { PrismaService } from '../database/prisma.service';

import { AuthService } from './auth.service';

interface MockUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  isDisabled: boolean;
  organizationId: string | null;
  userRoles: Array<{
    role: {
      name: 'admin' | 'shipper' | 'consignee' | 'agent';
    };
  }>;
}

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let prismaService: {
    user: {
      findUnique: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockUserRecord | null>
      >;
    };
    refreshToken: {
      create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
      findUnique: jest.MockedFunction<
        (...args: unknown[]) => Promise<{
          id: string;
          userId: string;
          tokenHash: string;
          expiresAt: Date;
        } | null>
      >;
      delete: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
      deleteMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    };
  };

  beforeEach(() => {
    jwtService = new JwtService({
      secret: 'test-secret'
    });

    prismaService = {
      user: {
        findUnique: jest.fn()
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn()
      }
    };

    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_ACCESS_EXPIRY: '15m',
          JWT_REFRESH_EXPIRY: '7d'
        };

        return values[key];
      })
    } as unknown as ConfigService;

    authService = new AuthService(
      prismaService as unknown as PrismaService,
      jwtService,
      configService
    );
  });

  it('logs in a valid user, returns token pair, and stores the refresh token hashed', async () => {
    const passwordHash = await authService.hashPassword('Password123!');
    const user = createUserRecord({
      passwordHash
    });
    prismaService.user.findUnique.mockResolvedValue(user);
    prismaService.refreshToken.create.mockResolvedValue(undefined);

    const response = await authService.login({
      email: user.email,
      password: 'Password123!'
    });

    expect(response.user).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      roles: ['admin']
    });
    expect(response.accessToken).toEqual(expect.any(String));
    expect(response.refreshToken).toEqual(expect.any(String));
    expect(prismaService.refreshToken.create).toHaveBeenCalledTimes(1);

    const createArgs = prismaService.refreshToken.create.mock.calls[0]?.[0] as {
      data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
      };
    };

    expect(createArgs.data.userId).toBe(user.id);
    expect(createArgs.data.tokenHash).not.toBe(response.refreshToken);
    expect(createArgs.data.expiresAt).toBeInstanceOf(Date);
  });

  it('rejects invalid credentials with 401', async () => {
    const passwordHash = await authService.hashPassword('Password123!');
    const user = createUserRecord({
      passwordHash
    });
    prismaService.user.findUnique.mockResolvedValue(user);

    await expect(
      authService.login({
        email: user.email,
        password: 'wrong-password'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects disabled users with 403', async () => {
    const passwordHash = await authService.hashPassword('Password123!');
    prismaService.user.findUnique.mockResolvedValue(
      createUserRecord({
        passwordHash,
        isDisabled: true
      })
    );

    await expect(
      authService.login({
        email: 'admin@example.com',
        password: 'Password123!'
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rotates a valid refresh token and revokes the previous token record', async () => {
    const passwordHash = await authService.hashPassword('Password123!');
    const user = createUserRecord({
      passwordHash
    });
    prismaService.user.findUnique
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user);
    prismaService.refreshToken.create.mockResolvedValue(undefined);
    prismaService.refreshToken.delete.mockResolvedValue(undefined);

    const loginResponse = await authService.login({
      email: user.email,
      password: 'Password123!'
    });

    const refreshCreateArgs = prismaService.refreshToken.create.mock
      .calls[0]?.[0] as {
      data: {
        id: string;
        tokenHash: string;
        expiresAt: Date;
      };
    };
    const previousTokenId = refreshCreateArgs.data.id as string;
    const previousTokenHash = refreshCreateArgs.data.tokenHash as string;
    const previousExpiresAt = refreshCreateArgs.data.expiresAt as Date;

    prismaService.refreshToken.findUnique.mockResolvedValue({
      id: previousTokenId,
      userId: user.id,
      tokenHash: previousTokenHash,
      expiresAt: previousExpiresAt
    });

    const refreshed = await authService.refresh({
      refreshToken: loginResponse.refreshToken
    });

    expect(refreshed.accessToken).toEqual(expect.any(String));
    expect(refreshed.refreshToken).toEqual(expect.any(String));
    expect(refreshed.refreshToken).not.toBe(loginResponse.refreshToken);
    expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
      where: {
        id: previousTokenId
      }
    });
    expect(prismaService.refreshToken.create).toHaveBeenCalledTimes(2);
  });

  it('rejects expired refresh tokens with 401', async () => {
    const refreshToken = await jwtService.signAsync(
      {
        sub: 'user-1',
        tokenId: 'token-1',
        type: 'refresh'
      },
      {
        secret: 'test-secret',
        expiresIn: '7d'
      }
    );

    prismaService.refreshToken.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      tokenHash: await authService.hashPassword(refreshToken),
      expiresAt: new Date(Date.now() - 1_000)
    });

    await expect(
      authService.refresh({
        refreshToken
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes a refresh token on logout', async () => {
    const passwordHash = await authService.hashPassword('Password123!');
    const user = createUserRecord({
      passwordHash
    });
    prismaService.user.findUnique.mockResolvedValue(user);
    prismaService.refreshToken.create.mockResolvedValue(undefined);
    prismaService.refreshToken.delete.mockResolvedValue(undefined);

    const loginResponse = await authService.login({
      email: user.email,
      password: 'Password123!'
    });

    const refreshCreateArgs = prismaService.refreshToken.create.mock
      .calls[0]?.[0] as {
      data: {
        id: string;
        tokenHash: string;
        expiresAt: Date;
      };
    };
    const tokenId = refreshCreateArgs.data.id as string;
    const tokenHash = refreshCreateArgs.data.tokenHash as string;
    const expiresAt = refreshCreateArgs.data.expiresAt as Date;

    prismaService.refreshToken.findUnique.mockResolvedValue({
      id: tokenId,
      userId: user.id,
      tokenHash,
      expiresAt
    });

    await expect(
      authService.logout(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          roles: ['admin']
        },
        {
          refreshToken: loginResponse.refreshToken
        }
      )
    ).resolves.toEqual({
      success: true
    });

    expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
      where: {
        id: tokenId
      }
    });
  });
});

function createUserRecord(overrides: Partial<MockUserRecord>): MockUserRecord {
  return {
    id: 'user-1',
    email: 'admin@example.com',
    passwordHash: 'unused',
    name: 'Admin User',
    isDisabled: false,
    organizationId: null,
    userRoles: [
      {
        role: {
          name: 'admin'
        }
      }
    ],
    ...overrides
  };
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {
  type RoleName,
  type UserSummary,
  type UserPayload,
  type UserWarning
} from '@ebooking-cx/shared';
import { hashPassword } from '../auth/password';
import { PrismaService } from '../database/prisma.service';
import type {
  ChangeUserPasswordDto,
  UpdateUserDto
} from './dto';

interface UserMutationResult {
  user: UserSummary;
  warnings: UserWarning[];
}

export interface CreateUserResult extends UserMutationResult {
  temporaryPassword: string;
}

@Injectable()
export class UsersService {
  public static readonly DEFAULT_PASSWORD = '123456';

  public constructor(private readonly prismaService: PrismaService) {}

  public async listOrganizationUsers(
    organizationId: string
  ): Promise<UserSummary[]> {
    await this.getOrganizationOrThrow(organizationId);

    const users = await this.prismaService.user.findMany({
      where: {
        organizationId
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    });

    return users.map((user) => this.toUserSummary(user));
  }

  public async listAdminUsers(): Promise<UserSummary[]> {
    const users = await this.prismaService.user.findMany({
      where: {
        organizationId: null,
        userRoles: {
          some: {
            role: {
              name: 'admin'
            }
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    });

    return users.map((user) => this.toUserSummary(user));
  }

  public async createUser(payload: UserPayload): Promise<CreateUserResult> {
    await this.assertEmailAvailable(payload.email);

    const normalizedPayload = await this.normalizeUserPayload(payload);
    const passwordHash = await hashPassword(UsersService.DEFAULT_PASSWORD);

    const user = await this.prismaService.user.create({
      data: {
        email: normalizedPayload.email,
        passwordHash,
        name: normalizedPayload.name,
        phone: normalizedPayload.phone,
        isDisabled: normalizedPayload.isDisabled,
        organizationId: normalizedPayload.organizationId,
        userRoles: {
          createMany: {
            data: normalizedPayload.roleIds.map((roleId) => ({
              roleId
            }))
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    return {
      user: this.toUserSummary(user),
      temporaryPassword: UsersService.DEFAULT_PASSWORD,
      warnings: normalizedPayload.warnings
    };
  }

  public async updateUser(
    userId: string,
    payload: UpdateUserDto
  ): Promise<UserMutationResult> {
    const existingUser = await this.getUserOrThrow(userId);
    const mergedPayload: UserPayload = {
      email: payload.email ?? existingUser.email,
      name: payload.name ?? existingUser.name,
      phone: payload.phone === undefined ? existingUser.phone : payload.phone,
      isDisabled: payload.isDisabled ?? existingUser.isDisabled,
      organizationId:
        payload.organizationId === undefined
          ? existingUser.organizationId
          : payload.organizationId,
      roles:
        payload.roles ??
        existingUser.userRoles.map(({ role }) => role.name as RoleName)
    };

    if (mergedPayload.email !== existingUser.email) {
      await this.assertEmailAvailable(mergedPayload.email, userId);
    }

    const normalizedPayload = await this.normalizeUserPayload(mergedPayload);

    const user = await this.prismaService.user.update({
      where: {
        id: userId
      },
      data: {
        email: normalizedPayload.email,
        name: normalizedPayload.name,
        phone: normalizedPayload.phone,
        isDisabled: normalizedPayload.isDisabled,
        organizationId: normalizedPayload.organizationId,
        userRoles: {
          deleteMany: {},
          createMany: {
            data: normalizedPayload.roleIds.map((roleId) => ({
              roleId
            }))
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    return {
      user: this.toUserSummary(user),
      warnings: normalizedPayload.warnings
    };
  }

  public async deleteUser(userId: string): Promise<void> {
    await this.getUserOrThrow(userId);

    await this.prismaService.user.delete({
      where: {
        id: userId
      }
    });
  }

  public async changePassword(
    userId: string,
    payload: ChangeUserPasswordDto
  ): Promise<{ success: true }> {
    await this.getUserOrThrow(userId);

    await this.prismaService.user.update({
      where: {
        id: userId
      },
      data: {
        passwordHash: await hashPassword(payload.password)
      }
    });

    await this.prismaService.refreshToken.deleteMany({
      where: {
        userId
      }
    });

    return {
      success: true
    };
  }

  private async assertEmailAvailable(
    email: string,
    excludedUserId?: string
  ): Promise<void> {
    const existingUsers = await this.prismaService.user.count({
      where: {
        email,
        ...(excludedUserId === undefined
          ? {}
          : {
              id: {
                not: excludedUserId
              }
            })
      }
    });

    if (existingUsers > 0) {
      throw new ConflictException({
        code: 'USER_EMAIL_EXISTS',
        message: 'A user with this email already exists.',
        statusCode: 409
      });
    }
  }

  private async normalizeUserPayload(payload: UserPayload): Promise<{
    email: string;
    name: string;
    phone: string | null;
    isDisabled: boolean;
    organizationId: string | null;
    roleIds: string[];
    warnings: UserWarning[];
  }> {
    this.assertRoleCombinationIsValid(payload.roles);

    const organizationId = payload.roles.includes('admin')
      ? null
      : payload.organizationId;

    if (!payload.roles.includes('admin') && organizationId === null) {
      throw new BadRequestException({
        code: 'USER_ORGANIZATION_REQUIRED',
        message: 'Non-admin users must belong to an organization.',
        statusCode: 400
      });
    }

    const organization =
      organizationId === null
        ? null
        : await this.getOrganizationOrThrow(organizationId);
    const roles = await this.getRolesOrThrow(payload.roles);

    return {
      email: payload.email,
      name: payload.name,
      phone: this.normalizeOptionalText(payload.phone),
      isDisabled: payload.isDisabled,
      organizationId,
      roleIds: roles.map((role) => role.id),
      warnings:
        organization === null
          ? []
          : this.buildRoleMismatchWarnings(payload.roles, organization)
    };
  }

  private assertRoleCombinationIsValid(roles: RoleName[]): void {
    if (roles.includes('admin')) {
      if (roles.length !== 1) {
        throw new BadRequestException({
          code: 'INVALID_ADMIN_ROLE_ASSIGNMENT',
          message: 'Admin users must only have the admin role.',
          statusCode: 400
        });
      }

      return;
    }

    if (roles.length === 0) {
      throw new BadRequestException({
        code: 'USER_ROLE_REQUIRED',
        message: 'At least one role must be assigned.',
        statusCode: 400
      });
    }
  }

  private async getRolesOrThrow(roles: RoleName[]): Promise<Array<{
    id: string;
    name: string;
  }>> {
    const roleRecords = await this.prismaService.role.findMany({
      where: {
        name: {
          in: roles
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    if (roleRecords.length !== roles.length) {
      throw new BadRequestException({
        code: 'INVALID_USER_ROLE',
        message: 'One or more roles are invalid.',
        statusCode: 400
      });
    }

    const roleMap = new Map(roleRecords.map((role) => [role.name, role]));

    return roles.map((roleName) => {
      const role = roleMap.get(roleName);

      if (role === undefined) {
        throw new BadRequestException({
          code: 'INVALID_USER_ROLE',
          message: 'One or more roles are invalid.',
          statusCode: 400
        });
      }

      return role;
    });
  }

  private buildRoleMismatchWarnings(
    roles: RoleName[],
    organization: {
      isShipper: boolean;
      isConsignee: boolean;
      isAgent: boolean;
    }
  ): UserWarning[] {
    const mismatchedRoles = roles.filter((role) => {
      if (role === 'shipper') {
        return organization.isShipper === false;
      }

      if (role === 'consignee') {
        return organization.isConsignee === false;
      }

      if (role === 'agent') {
        return organization.isAgent === false;
      }

      return false;
    });

    return mismatchedRoles.map((role) => ({
      code: 'ROLE_ORGANIZATION_TYPE_MISMATCH',
      message: `Role '${role}' does not match the selected organization's type flags.`
    }));
  }

  private async getOrganizationOrThrow(organizationId: string): Promise<{
    id: string;
    name: string;
    isShipper: boolean;
    isConsignee: boolean;
    isAgent: boolean;
  }> {
    const organization = await this.prismaService.organization.findUnique({
      where: {
        id: organizationId
      }
    });

    if (organization === null) {
      throw new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found.',
        statusCode: 404
      });
    }

    return organization;
  }

  private async getUserOrThrow(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    isDisabled: boolean;
    organizationId: string | null;
    createdAt: Date;
    updatedAt: Date;
    userRoles: Array<{
      role: {
        name: string;
      };
    }>;
  }> {
    const user = await this.prismaService.user.findUnique({
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

    if (user === null) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
        statusCode: 404
      });
    }

    return user;
  }

  private normalizeOptionalText(value: string | null): string | null {
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  private toUserSummary(user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    isDisabled: boolean;
    organizationId: string | null;
    createdAt: Date;
    updatedAt: Date;
    userRoles: Array<{
      role: {
        name: string;
      };
    }>;
  }): UserSummary {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isDisabled: user.isDisabled,
      organizationId: user.organizationId,
      roles: user.userRoles.map(({ role }) => role.name as RoleName),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }
}

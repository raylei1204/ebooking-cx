import {
  BadRequestException,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { PrismaService } from '../database/prisma.service';

import { UsersService } from './users.service';

interface MockRoleRecord {
  id: string;
  name: 'admin' | 'shipper' | 'consignee' | 'agent';
}

interface MockOrganizationRecord {
  id: string;
  name: string;
  isShipper: boolean;
  isConsignee: boolean;
  isAgent: boolean;
}

interface MockUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  isDisabled: boolean;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: MockOrganizationRecord | null;
  userRoles: Array<{
    role: MockRoleRecord;
  }>;
}

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: {
    user: {
      findMany: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockUserRecord[]>
      >;
      findUnique: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockUserRecord | null>
      >;
      create: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockUserRecord>
      >;
      update: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockUserRecord>
      >;
      delete: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
      count: jest.MockedFunction<(...args: unknown[]) => Promise<number>>;
    };
    role: {
      findMany: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockRoleRecord[]>
      >;
    };
    organization: {
      findUnique: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockOrganizationRecord | null>
      >;
    };
    refreshToken: {
      deleteMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    };
  };

  beforeEach(() => {
    prismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      role: {
        findMany: jest.fn()
      },
      organization: {
        findUnique: jest.fn()
      },
      refreshToken: {
        deleteMany: jest.fn()
      }
    };

    usersService = new UsersService(
      prismaService as unknown as PrismaService
    );
  });

  it('lists users for a selected organization', async () => {
    prismaService.organization.findUnique.mockResolvedValue(
      createOrganizationRecord({ id: 'org-1' })
    );
    prismaService.user.findMany.mockResolvedValue([
      createUserRecord({
        id: 'user-1',
        organizationId: 'org-1',
        userRoles: [{ role: createRoleRecord('shipper') }]
      })
    ]);

    const users = await usersService.listOrganizationUsers('org-1');

    expect(users).toEqual([
      expect.objectContaining({
        id: 'user-1',
        organizationId: 'org-1',
        roles: ['shipper']
      })
    ]);
  });

  it('lists admin users with null organization and admin role semantics', async () => {
    prismaService.user.findMany.mockResolvedValue([
      createUserRecord({
        organizationId: null,
        userRoles: [{ role: createRoleRecord('admin') }]
      })
    ]);

    const users = await usersService.listAdminUsers();

    expect(prismaService.user.findMany).toHaveBeenCalledWith({
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
    expect(users[0]?.roles).toEqual(['admin']);
  });

  it('creates an admin user without an organization and returns the default password', async () => {
    prismaService.user.count.mockResolvedValue(0);
    prismaService.role.findMany.mockResolvedValue([createRoleRecord('admin')]);
    prismaService.user.create.mockResolvedValue(
      createUserRecord({
        organizationId: null,
        userRoles: [{ role: createRoleRecord('admin') }]
      })
    );

    const created = await usersService.createUser({
      email: 'admin2@example.com',
      name: 'Admin 2',
      phone: null,
      isDisabled: false,
      organizationId: 'org-should-be-ignored',
      roles: ['admin']
    });

    expect(created.temporaryPassword).toBe('123456');
    expect(created.user.organizationId).toBeNull();
    expect(created.user.roles).toEqual(['admin']);

    const createArgs = prismaService.user.create.mock.calls[0]?.[0] as {
      data: {
        organizationId: string | null;
        passwordHash: string;
        userRoles: {
          createMany: {
            data: Array<{ roleId: string }>;
          };
        };
      };
    };

    expect(createArgs.data.organizationId).toBeNull();
    expect(createArgs.data.passwordHash).not.toBe('123456');
    expect(createArgs.data.userRoles.createMany.data).toEqual([
      { roleId: 'role-admin' }
    ]);
  });

  it('creates an organization user with multiple roles and returns mismatch warnings without blocking', async () => {
    prismaService.user.count.mockResolvedValue(0);
    prismaService.organization.findUnique.mockResolvedValue(
      createOrganizationRecord({
        id: 'org-1',
        isShipper: true,
        isConsignee: false,
        isAgent: false
      })
    );
    prismaService.role.findMany.mockResolvedValue([
      createRoleRecord('shipper'),
      createRoleRecord('agent')
    ]);
    prismaService.user.create.mockResolvedValue(
      createUserRecord({
        organizationId: 'org-1',
        userRoles: [
          { role: createRoleRecord('shipper') },
          { role: createRoleRecord('agent') }
        ]
      })
    );

    const created = await usersService.createUser({
      email: 'user@example.com',
      name: 'Mikey',
      phone: '',
      isDisabled: false,
      organizationId: 'org-1',
      roles: ['shipper', 'agent']
    });

    expect(created.user.phone).toBeNull();
    expect(created.user.roles).toEqual(['shipper', 'agent']);
    expect(created.warnings).toEqual([
      {
        code: 'ROLE_ORGANIZATION_TYPE_MISMATCH',
        message: "Role 'agent' does not match the selected organization's type flags."
      }
    ]);
  });

  it('updates disabled state and invalidates refresh tokens when password changes', async () => {
    prismaService.user.findUnique.mockResolvedValue(
      createUserRecord({
        id: 'user-2',
        organizationId: 'org-1',
        userRoles: [{ role: createRoleRecord('shipper') }]
      })
    );
    prismaService.organization.findUnique.mockResolvedValue(
      createOrganizationRecord({ id: 'org-1', isShipper: true })
    );
    prismaService.role.findMany.mockResolvedValue([createRoleRecord('shipper')]);
    prismaService.user.update
      .mockResolvedValueOnce(
        createUserRecord({
          id: 'user-2',
          isDisabled: true,
          organizationId: 'org-1',
          userRoles: [{ role: createRoleRecord('shipper') }]
        })
      )
      .mockResolvedValueOnce(
        createUserRecord({
          id: 'user-2',
          organizationId: 'org-1',
          userRoles: [{ role: createRoleRecord('shipper') }]
        })
      );
    prismaService.refreshToken.deleteMany.mockResolvedValue({
      count: 2
    });

    const updated = await usersService.updateUser('user-2', {
      isDisabled: true,
      roles: ['shipper'],
      organizationId: 'org-1'
    });

    expect(updated.user.isDisabled).toBe(true);

    await usersService.changePassword('user-2', {
      password: 'NewPassword123!'
    });

    expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-2'
      }
    });
  });

  it('deletes an existing user', async () => {
    prismaService.user.findUnique.mockResolvedValue(createUserRecord());
    prismaService.user.delete.mockResolvedValue(undefined);

    await usersService.deleteUser('user-1');

    expect(prismaService.user.delete).toHaveBeenCalledWith({
      where: {
        id: 'user-1'
      }
    });
  });

  it('rejects duplicate emails on create', async () => {
    prismaService.user.count.mockResolvedValue(1);

    await expect(
      usersService.createUser({
        email: 'user@example.com',
        name: 'Mikey',
        phone: null,
        isDisabled: false,
        organizationId: 'org-1',
        roles: ['shipper']
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects when the target organization is missing', async () => {
    prismaService.user.count.mockResolvedValue(0);
    prismaService.organization.findUnique.mockResolvedValue(null);
    prismaService.role.findMany.mockResolvedValue([createRoleRecord('shipper')]);

    await expect(
      usersService.createUser({
        email: 'user@example.com',
        name: 'Mikey',
        phone: null,
        isDisabled: false,
        organizationId: 'org-missing',
        roles: ['shipper']
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects admin role combinations with non-admin roles', async () => {
    await expect(
      usersService.createUser({
        email: 'user@example.com',
        name: 'Mikey',
        phone: null,
        isDisabled: false,
        organizationId: null,
        roles: ['admin', 'shipper']
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createRoleRecord(
  name: 'admin' | 'shipper' | 'consignee' | 'agent'
): MockRoleRecord {
  return {
    id: `role-${name}`,
    name
  };
}

function createOrganizationRecord(
  overrides: Partial<MockOrganizationRecord> = {}
): MockOrganizationRecord {
  return {
    id: 'org-1',
    name: 'Kuafu',
    isShipper: false,
    isConsignee: false,
    isAgent: false,
    ...overrides
  };
}

function createUserRecord(
  overrides: Partial<MockUserRecord> = {}
): MockUserRecord {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    name: 'Mikey',
    phone: null,
    isDisabled: false,
    organizationId: null,
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    organization: null,
    userRoles: [{ role: createRoleRecord('admin') }],
    ...overrides
  };
}

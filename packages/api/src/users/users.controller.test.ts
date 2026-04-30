import {
  CanActivate,
  Controller,
  ExecutionContext,
  Injectable
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import request from 'supertest';

import { applyAppSetup } from '../common/bootstrap/app-bootstrap';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Injectable()
class TestJwtAuthGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: {
        userId: string;
        email: string;
        name: string;
        organizationId: string | null;
        roles: ['admin'];
      };
    }>();

    request.user = {
      userId: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      organizationId: null,
      roles: ['admin']
    };

    return true;
  }
}

@Injectable()
class TestRolesGuard implements CanActivate {
  public canActivate(): boolean {
    return true;
  }
}

@Injectable()
class NonAdminJwtAuthGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: {
        userId: string;
        email: string;
        name: string;
        organizationId: string | null;
        roles: ['shipper'];
      };
    }>();

    request.user = {
      userId: 'user-2',
      email: 'shipper@example.com',
      name: 'Shipper User',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      roles: ['shipper']
    };

    return true;
  }
}

@Controller()
class NoopController {}

describe('UsersController', () => {
  let moduleFixture: TestingModule;
  let usersService: {
    listOrganizationUsers: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
    listAdminUsers: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
    createUser: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    updateUser: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    deleteUser: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    changePassword: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
  };

  beforeEach(async () => {
    usersService = {
      listOrganizationUsers: jest.fn(),
      listAdminUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      changePassword: jest.fn()
    };

    moduleFixture = await Test.createTestingModule({
      controllers: [UsersController, NoopController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
      .compile();
  });

  afterEach(async () => {
    await moduleFixture?.close();
  });

  it('lists organization users inside the shared success envelope', async () => {
    usersService.listOrganizationUsers.mockResolvedValue([
      createUserSummary({
        id: 'user-2',
        organizationId: 'org-1',
        roles: ['shipper']
      })
    ]);

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/internal/organizations/org-1/users')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        data: [
          {
            id: 'user-2',
            email: 'user@example.com',
            name: 'Mikey',
            phone: null,
            isDisabled: false,
            organizationId: 'org-1',
            roles: ['shipper'],
            createdAt: '2026-04-30T00:00:00.000Z',
            updatedAt: '2026-04-30T00:00:00.000Z'
          }
        ]
      });

    expect(usersService.listOrganizationUsers).toHaveBeenCalledWith('org-1');

    await app.close();
  });

  it('lists admin users inside the shared success envelope', async () => {
    usersService.listAdminUsers.mockResolvedValue([
      createUserSummary({
        organizationId: null,
        roles: ['admin']
      })
    ]);

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/internal/users/admins')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        data: [
          {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Mikey',
            phone: null,
            isDisabled: false,
            organizationId: null,
            roles: ['admin'],
            createdAt: '2026-04-30T00:00:00.000Z',
            updatedAt: '2026-04-30T00:00:00.000Z'
          }
        ]
      });

    await app.close();
  });

  it('creates a user and returns the temporary password in the response data', async () => {
    usersService.createUser.mockResolvedValue({
      user: createUserSummary({
        id: 'user-3',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        roles: ['shipper']
      }),
      temporaryPassword: '123456',
      warnings: [
        {
          code: 'ROLE_ORGANIZATION_TYPE_MISMATCH',
          message:
            "Role 'shipper' does not match the selected organization's type flags."
        }
      ]
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/internal/users')
      .set('Authorization', 'Bearer access-token')
      .send({
        email: 'user@example.com',
        name: 'Mikey',
        phone: null,
        isDisabled: false,
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        roles: ['shipper']
      })
      .expect(201)
      .expect({
        data: {
          user: {
            id: 'user-3',
            email: 'user@example.com',
            name: 'Mikey',
            phone: null,
            isDisabled: false,
            organizationId: '550e8400-e29b-41d4-a716-446655440000',
            roles: ['shipper'],
            createdAt: '2026-04-30T00:00:00.000Z',
            updatedAt: '2026-04-30T00:00:00.000Z'
          },
          temporaryPassword: '123456'
        },
        meta: {
          warnings: [
            {
              code: 'ROLE_ORGANIZATION_TYPE_MISMATCH',
              message:
                "Role 'shipper' does not match the selected organization's type flags."
            }
          ]
        }
      });

    await app.close();
  });

  it('updates a user and returns warnings in meta when present', async () => {
    usersService.updateUser.mockResolvedValue({
      user: createUserSummary({
        id: 'user-4',
        organizationId: '660e8400-e29b-41d4-a716-446655440000',
        roles: ['agent']
      }),
      warnings: [
        {
          code: 'ROLE_ORGANIZATION_TYPE_MISMATCH',
          message:
            "Role 'agent' does not match the selected organization's type flags."
        }
      ]
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .patch('/api/v1/internal/users/user-4')
      .set('Authorization', 'Bearer access-token')
      .send({
        organizationId: '660e8400-e29b-41d4-a716-446655440000',
        roles: ['agent']
      })
      .expect(200)
      .expect({
        data: {
          id: 'user-4',
          email: 'user@example.com',
          name: 'Mikey',
          phone: null,
          isDisabled: false,
          organizationId: '660e8400-e29b-41d4-a716-446655440000',
          roles: ['agent'],
          createdAt: '2026-04-30T00:00:00.000Z',
          updatedAt: '2026-04-30T00:00:00.000Z'
        },
        meta: {
          warnings: [
            {
              code: 'ROLE_ORGANIZATION_TYPE_MISMATCH',
              message:
                "Role 'agent' does not match the selected organization's type flags."
            }
          ]
        }
      });

    await app.close();
  });

  it('changes a user password inside the shared success envelope', async () => {
    usersService.changePassword.mockResolvedValue({
      success: true
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .patch('/api/v1/internal/users/user-5/password')
      .set('Authorization', 'Bearer access-token')
      .send({
        password: 'NewPassword123!'
      })
      .expect(200)
      .expect({
        data: {
          success: true
        }
      });

    expect(usersService.changePassword).toHaveBeenCalledWith('user-5', {
      password: 'NewPassword123!'
    });

    await app.close();
  });

  it('deletes a user with 204', async () => {
    usersService.deleteUser.mockResolvedValue(undefined);

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .delete('/api/v1/internal/users/user-6')
      .set('Authorization', 'Bearer access-token')
      .expect(204);

    expect(usersService.deleteUser).toHaveBeenCalledWith('user-6');

    await app.close();
  });

  it('rejects non-admin access to admin-only routes', async () => {
    const restrictedModule = await Test.createTestingModule({
      controllers: [UsersController, NoopController],
      providers: [
        RolesGuard,
        {
          provide: UsersService,
          useValue: usersService
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(NonAdminJwtAuthGuard)
      .compile();

    const app = restrictedModule.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/internal/users/admins')
      .set('Authorization', 'Bearer access-token')
      .expect(403)
      .expect({
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'You do not have permission to access this resource.',
          statusCode: 403
        }
      });

    await app.close();
    await restrictedModule.close();
  });
});

function createUserSummary(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isDisabled: boolean;
  organizationId: string | null;
  roles: Array<'admin' | 'shipper' | 'consignee' | 'agent'>;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Mikey',
    phone: null,
    isDisabled: false,
    organizationId: null,
    roles: ['admin'] as Array<'admin' | 'shipper' | 'consignee' | 'agent'>,
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
    ...overrides
  };
}

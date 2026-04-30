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
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

@Controller()
class NoopController {}

describe('AuthController', () => {
  let moduleFixture: TestingModule;
  let authService: {
    login: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    refresh: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    logout: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn()
    };

    moduleFixture = await Test.createTestingModule({
      controllers: [AuthController, NoopController],
      providers: [
        {
          provide: AuthService,
          useValue: authService
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();
  });

  afterEach(async () => {
    await moduleFixture?.close();
  });

  it('returns the login response inside the shared success envelope', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        organizationId: null,
        roles: ['admin']
      }
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      })
      .expect(201)
      .expect({
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: {
            id: 'user-1',
            email: 'admin@example.com',
            name: 'Admin User',
            organizationId: null,
            roles: ['admin']
          }
        }
      });

    await app.close();
  });

  it('returns the refreshed token pair inside the shared success envelope', async () => {
    authService.refresh.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: 'refresh-token'
      })
      .expect(201)
      .expect({
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      });

    await app.close();
  });

  it('uses the JWT guard on logout and returns the shared success envelope', async () => {
    authService.logout.mockResolvedValue({
      success: true
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer access-token')
      .send({
        refreshToken: 'refresh-token'
      })
      .expect(201)
      .expect({
        data: {
          success: true
        }
      });

    expect(authService.logout).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        organizationId: null,
        roles: ['admin']
      },
      {
        refreshToken: 'refresh-token'
      }
    );

    await app.close();
  });
});

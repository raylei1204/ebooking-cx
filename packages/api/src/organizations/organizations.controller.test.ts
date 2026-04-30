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
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

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

@Controller()
class NoopController {}

describe('OrganizationsController', () => {
  let moduleFixture: TestingModule;
  let organizationsService: {
    listOrganizations: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
    createOrganization: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
    updateOrganization: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
    deleteOrganization: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
    listRelationships: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
    createRelationship: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
    deleteRelationship: jest.MockedFunction<
      (...args: unknown[]) => Promise<unknown>
    >;
  };

  beforeEach(async () => {
    organizationsService = {
      listOrganizations: jest.fn(),
      createOrganization: jest.fn(),
      updateOrganization: jest.fn(),
      deleteOrganization: jest.fn(),
      listRelationships: jest.fn(),
      createRelationship: jest.fn(),
      deleteRelationship: jest.fn()
    };

    moduleFixture = await Test.createTestingModule({
      controllers: [OrganizationsController, NoopController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: organizationsService
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

  it('lists organizations inside the shared success envelope', async () => {
    organizationsService.listOrganizations.mockResolvedValue([
      {
        id: 'org-1',
        name: 'Kuafu',
        code: 'KUA',
        cwCode: null,
        isShipper: true,
        isConsignee: false,
        isAgent: false,
        origin: null,
        address1: null,
        address2: null,
        address3: null,
        address4: null,
        city: null,
        postal: null,
        country: null,
        createdAt: '2026-04-30T00:00:00.000Z',
        updatedAt: '2026-04-30T00:00:00.000Z'
      }
    ]);

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/internal/organizations?isShipper=true')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        data: [
          {
            id: 'org-1',
            name: 'Kuafu',
            code: 'KUA',
            cwCode: null,
            isShipper: true,
            isConsignee: false,
            isAgent: false,
            origin: null,
            address1: null,
            address2: null,
            address3: null,
            address4: null,
            city: null,
            postal: null,
            country: null,
            createdAt: '2026-04-30T00:00:00.000Z',
            updatedAt: '2026-04-30T00:00:00.000Z'
          }
        ]
      });

    expect(organizationsService.listOrganizations).toHaveBeenCalledWith({
      isShipper: true
    });

    await app.close();
  });

  it('creates an organization inside the shared success envelope', async () => {
    organizationsService.createOrganization.mockResolvedValue({
      id: 'org-1',
      name: 'Kuafu',
      code: 'KUA',
      cwCode: null,
      isShipper: true,
      isConsignee: false,
      isAgent: false,
      origin: null,
      address1: null,
      address2: null,
      address3: null,
      address4: null,
      city: null,
      postal: null,
      country: null,
      createdAt: '2026-04-30T00:00:00.000Z',
      updatedAt: '2026-04-30T00:00:00.000Z'
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/internal/organizations')
      .set('Authorization', 'Bearer access-token')
      .send({
        name: 'Kuafu',
        code: 'KUA',
        cwCode: null,
        isShipper: true,
        isConsignee: false,
        isAgent: false
      })
      .expect(201)
      .expect({
        data: {
          id: 'org-1',
          name: 'Kuafu',
          code: 'KUA',
          cwCode: null,
          isShipper: true,
          isConsignee: false,
          isAgent: false,
          origin: null,
          address1: null,
          address2: null,
          address3: null,
          address4: null,
          city: null,
          postal: null,
          country: null,
          createdAt: '2026-04-30T00:00:00.000Z',
          updatedAt: '2026-04-30T00:00:00.000Z'
        }
      });

    await app.close();
  });

  it('rejects invalid organization payloads with the shared validation error response', async () => {
    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/internal/organizations')
      .set('Authorization', 'Bearer access-token')
      .send({
        name: '',
        isShipper: 'yes'
      })
      .expect(400)
      .expect({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          statusCode: 400
        }
      });

    await app.close();
  });

  it('lists organization relationships inside the shared success envelope', async () => {
    organizationsService.listRelationships.mockResolvedValue([
      {
        id: 'rel-1',
        label: 'Preferred agent',
        relatedOrganization: {
          id: 'org-2',
          name: 'Agent Org',
          code: 'AGT',
          cwCode: null,
          isShipper: false,
          isConsignee: false,
          isAgent: true,
          origin: null,
          address1: null,
          address2: null,
          address3: null,
          address4: null,
          city: null,
          postal: null,
          country: null,
          createdAt: '2026-04-30T00:00:00.000Z',
          updatedAt: '2026-04-30T00:00:00.000Z'
        }
      }
    ]);

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/internal/organizations/org-1/relationships')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        data: [
          {
            id: 'rel-1',
            label: 'Preferred agent',
            relatedOrganization: {
              id: 'org-2',
              name: 'Agent Org',
              code: 'AGT',
              cwCode: null,
              isShipper: false,
              isConsignee: false,
              isAgent: true,
              origin: null,
              address1: null,
              address2: null,
              address3: null,
              address4: null,
              city: null,
              postal: null,
              country: null,
              createdAt: '2026-04-30T00:00:00.000Z',
              updatedAt: '2026-04-30T00:00:00.000Z'
            }
          }
        ]
      });

    await app.close();
  });
});

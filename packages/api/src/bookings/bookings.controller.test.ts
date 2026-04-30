import {
  CanActivate,
  Controller,
  ExecutionContext,
  Injectable
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
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

import { ROLES_KEY } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { applyAppSetup } from '../common/bootstrap/app-bootstrap';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Injectable()
class TestJwtAuthGuard implements CanActivate {
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
      userId: 'user-1',
      email: 'shipper@example.com',
      name: 'Shipper User',
      organizationId: 'org-1',
      roles: ['shipper']
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

describe('BookingsController', () => {
  let moduleFixture: TestingModule;
  let bookingsService: {
    createBooking: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    updateBooking: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    getBooking: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    listBookings: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    listParties: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    listPorts: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    importPoFile: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };

  beforeEach(async () => {
    bookingsService = {
      createBooking: jest.fn(),
      updateBooking: jest.fn(),
      getBooking: jest.fn(),
      listBookings: jest.fn(),
      listParties: jest.fn(),
      listPorts: jest.fn(),
      importPoFile: jest.fn()
    };

    moduleFixture = await Test.createTestingModule({
      controllers: [BookingsController, NoopController],
      providers: [
        {
          provide: BookingsService,
          useValue: bookingsService
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

  it('applies jwt and role guards with shipper/admin access to the controller', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, BookingsController) as
      | unknown[]
      | undefined;
    const roles = Reflect.getMetadata(ROLES_KEY, BookingsController) as
      | string[]
      | undefined;

    expect(guards).toHaveLength(2);
    expect(roles).toEqual(['shipper', 'admin']);
  });

  it('creates a booking inside the shared success envelope', async () => {
    bookingsService.createBooking.mockResolvedValue({
      bookingId: 'booking-1',
      eBookingNumber: 'arc2026043000001',
      hawbNumber: null,
      status: 'SUBMITTED',
      createdAt: '2026-04-30T10:00:00.000Z'
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/internal/bookings')
      .set('Authorization', 'Bearer access-token')
      .send({
        isDraft: false,
        shipMode: 'AIR',
        shipper: {
          partyId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Acme Corp',
          address1: '123 Main St',
          address2: '',
          address3: '',
          address4: ''
        },
        consignee: {
          partyId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Beta Ltd',
          address1: '456 Oak Ave',
          address2: '',
          address3: '',
          address4: ''
        },
        notifyParty1: null,
        notifyParty2: null,
        shipmentDetail: {
          originPortId: '550e8400-e29b-41d4-a716-446655440002',
          destinationPortId: '550e8400-e29b-41d4-a716-446655440003',
          finalDestinationPortId: null,
          grossWeight: 100.5,
          cbm: 2.3,
          numberOfPackage: 10,
          cargoReadyDate: '2026-06-01',
          etd: '2026-06-05',
          eta: '2026-06-12',
          freightCharges: 'PREPAID',
          otherCharges: 'COLLECT',
          incoterm: 'CIF',
          sampleShipment: false,
          seaDetail: null
        },
        marksAndNumber: {
          descriptionOfGoods: 'Textile goods',
          marksNos: 'PO-001',
          containsBatteries: false
        },
        poDetails: []
      })
      .expect(201)
      .expect({
        data: {
          bookingId: 'booking-1',
          eBookingNumber: 'arc2026043000001',
          hawbNumber: null,
          status: 'SUBMITTED',
          createdAt: '2026-04-30T10:00:00.000Z'
        }
      });

    await app.close();
  });

  it('lists draft bookings with pagination metadata inside the shared success envelope', async () => {
    bookingsService.listBookings.mockResolvedValue({
      data: [
        {
          bookingId: 'booking-1',
          referenceNumber: 'REF-001',
          shipMode: 'AIR',
          shipperName: 'Acme Corp',
          createdAt: '2026-04-30T10:00:00.000Z'
        }
      ],
      meta: {
        page: 1,
        total: 5
      }
    });

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/internal/bookings?status=DRAFT&page=1&limit=20')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        data: [
          {
            bookingId: 'booking-1',
            referenceNumber: 'REF-001',
            shipMode: 'AIR',
            shipperName: 'Acme Corp',
            createdAt: '2026-04-30T10:00:00.000Z'
          }
        ],
        meta: {
          page: 1,
          total: 5
        }
      });

    await app.close();
  });
});

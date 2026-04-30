import {
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { BookingStatus } from '@prisma/client';
import type { CreateBookingPayload } from '@ebooking-cx/shared';

import type { PrismaService } from '../database/prisma.service';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let bookingsService: BookingsService;
  let prismaService: MockPrismaService;
  let bookingNumberService: MockBookingNumberService;

  beforeEach(() => {
    prismaService = createPrismaServiceMock();
    bookingNumberService = {
      generateNextNumber: jest.fn()
    };

    bookingsService = new (BookingsService as unknown as new (
      prismaService: PrismaService,
      bookingNumberService: MockBookingNumberService
    ) => BookingsService)(
      prismaService as unknown as PrismaService,
      bookingNumberService
    );
  });

  it('creates a draft with only ship mode and without an e-booking number', async () => {
    prismaService.booking.create.mockResolvedValue(
      createBookingRecord({
        status: 'DRAFT',
        eBookingNumber: null
      })
    );

    const result = await bookingsService.createBooking('user-1', createDraftPayload());

    expect(bookingNumberService.generateNextNumber).not.toHaveBeenCalled();
    expect(prismaService.booking.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyCode: 'arc',
        createdBy: 'user-1',
        shipMode: 'AIR',
        status: 'DRAFT',
        eBookingNumber: null
      })
    });
    expect(result).toEqual({
      bookingId: 'booking-1',
      eBookingNumber: null,
      hawbNumber: null,
      status: 'DRAFT',
      createdAt: '2026-04-30T10:00:00.000Z'
    });
  });

  it('rejects submit when required fields are missing', async () => {
    await expect(
      bookingsService.createBooking('user-1', createDraftPayload({ isDraft: false }))
    ).rejects.toThrow(BadRequestException);

    await expect(
      bookingsService.createBooking('user-1', createDraftPayload({ isDraft: false }))
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'shipper.name' }),
          expect.objectContaining({ field: 'consignee.name' }),
          expect.objectContaining({ field: 'shipmentDetail.originPortId' }),
          expect.objectContaining({ field: 'shipmentDetail.grossWeight' })
        ])
      })
    });
  });

  it('rejects a missing party reference', async () => {
    prismaService.party.findMany.mockResolvedValue([]);
    prismaService.portInfo.findMany.mockResolvedValue([
      createPortRecord({ id: 'port-1' }),
      createPortRecord({ id: 'port-2' })
    ]);

    await expect(
      bookingsService.createBooking(
        'user-1',
        createSubmittedPayload()
      )
    ).rejects.toThrow(NotFoundException);

    await expect(
      bookingsService.createBooking(
        'user-1',
        createSubmittedPayload()
      )
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'PARTY_NOT_FOUND'
      })
    });
  });

  it('rejects a missing port reference', async () => {
    prismaService.party.findMany.mockResolvedValue([
      createPartyRecord({ id: 'party-1' }),
      createPartyRecord({ id: 'party-2' })
    ]);
    prismaService.portInfo.findMany.mockResolvedValue([createPortRecord({ id: 'port-1' })]);

    await expect(
      bookingsService.createBooking(
        'user-1',
        createSubmittedPayload()
      )
    ).rejects.toThrow(NotFoundException);

    await expect(
      bookingsService.createBooking(
        'user-1',
        createSubmittedPayload()
      )
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'PORT_NOT_FOUND'
      })
    });
  });

  it('creates a submitted booking with an atomic e-booking number and computed weights', async () => {
    prismaService.party.findMany.mockResolvedValue([
      createPartyRecord({ id: 'party-1' }),
      createPartyRecord({ id: 'party-2' })
    ]);
    prismaService.portInfo.findMany.mockResolvedValue([
      createPortRecord({ id: 'port-1' }),
      createPortRecord({ id: 'port-2' }),
      createPortRecord({ id: 'port-3' })
    ]);
    bookingNumberService.generateNextNumber.mockResolvedValue('arc2026043000001');
    prismaService.booking.create.mockResolvedValue(
      createBookingRecord({
        status: 'SUBMITTED',
        eBookingNumber: 'arc2026043000001'
      })
    );

    const result = await bookingsService.createBooking('user-1', createSubmittedPayload());

    expect(bookingNumberService.generateNextNumber).toHaveBeenCalledTimes(1);

    const createArgs = prismaService.booking.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toEqual(
      expect.objectContaining({
        companyCode: 'arc',
        eBookingNumber: 'arc2026043000001',
        status: 'SUBMITTED'
      })
    );
    expect(result.eBookingNumber).toBe('arc2026043000001');
    expect(prismaService.bookingShipmentDetail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: 'booking-1'
      })
    });
  });

  it('rejects updates to submitted bookings', async () => {
    prismaService.booking.findUnique.mockResolvedValue(
      createBookingRecord({
        status: 'SUBMITTED',
        eBookingNumber: 'arc2026043000001'
      })
    );

    await expect(
      bookingsService.updateBooking(
        'booking-1',
        createSubmittedPayload()
      )
    ).rejects.toThrow(BadRequestException);

    await expect(
      bookingsService.updateBooking(
        'booking-1',
        createSubmittedPayload()
      )
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'BOOKING_NOT_EDITABLE'
      })
    });
  });

  it('clears sea detail when a draft switches from sea to air', async () => {
    prismaService.booking.findUnique.mockResolvedValue(
      createBookingRecord({
        status: 'DRAFT',
        shipMode: 'SEA'
      })
    );
    prismaService.booking.update.mockResolvedValue(
      createBookingRecord({
        status: 'DRAFT',
        shipMode: 'AIR'
      })
    );

    await bookingsService.updateBooking(
      'booking-1',
      createDraftPayload({
        shipMode: 'AIR',
        shipmentDetail: {
          ...createDraftPayload().shipmentDetail,
          seaDetail: null
        }
      })
    );

    expect(prismaService.bookingSeaDetail.deleteMany).toHaveBeenCalledWith({
      where: {
        bookingId: 'booking-1'
      }
    });
  });
});

interface MockBookingRecord {
  id: string;
  eBookingNumber: string | null;
  hawbNumber: string | null;
  status: BookingStatus;
  shipMode: 'AIR' | 'SEA';
  createdAt: Date;
}

interface MockPartyRecord {
  id: string;
}

interface MockPortRecord {
  id: string;
}

interface MockBookingNumberService {
  generateNextNumber: jest.MockedFunction<
    (issuedAt?: Date) => Promise<string>
  >;
}

interface MockPrismaService {
  $transaction: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  booking: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<MockBookingRecord>>;
    update: jest.MockedFunction<(...args: unknown[]) => Promise<MockBookingRecord>>;
    findUnique: jest.MockedFunction<(...args: unknown[]) => Promise<MockBookingRecord | null>>;
  };
  bookingParty: {
    deleteMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    createMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  bookingPoDetail: {
    deleteMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    createMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  bookingShipmentDetail: {
    deleteMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  bookingMark: {
    deleteMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  bookingSeaDetail: {
    deleteMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  party: {
    findMany: jest.MockedFunction<(...args: unknown[]) => Promise<MockPartyRecord[]>>;
  };
  portInfo: {
    findMany: jest.MockedFunction<(...args: unknown[]) => Promise<MockPortRecord[]>>;
  };
}

function createPrismaServiceMock(): MockPrismaService {
  const prismaService = {
    booking: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn()
    },
    bookingParty: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    bookingPoDetail: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    bookingShipmentDetail: {
      deleteMany: jest.fn(),
      create: jest.fn()
    },
    bookingMark: {
      deleteMany: jest.fn(),
      create: jest.fn()
    },
    bookingSeaDetail: {
      deleteMany: jest.fn(),
      create: jest.fn()
    },
    party: {
      findMany: jest.fn()
    },
    portInfo: {
      findMany: jest.fn()
    }
  } as unknown as MockPrismaService;

  prismaService.$transaction = jest.fn(async (callback: unknown) =>
    (callback as (transaction: MockPrismaService) => Promise<unknown>)(prismaService)
  );

  return prismaService;
}

function createDraftPayload(
  overrides: Partial<CreateBookingPayload> = {}
): CreateBookingPayload {
  return {
    isDraft: true,
    shipMode: 'AIR',
    referenceNumber: null,
    shipper: {
      partyId: null,
      name: '',
      address1: '',
      address2: '',
      address3: '',
      address4: ''
    },
    consignee: {
      partyId: null,
      name: '',
      address1: '',
      address2: '',
      address3: '',
      address4: ''
    },
    notifyParty1: null,
    notifyParty2: null,
    shipmentDetail: {
      originPortId: null,
      destinationPortId: null,
      finalDestinationPortId: null,
      grossWeight: null,
      cbm: null,
      numberOfPackage: null,
      cargoReadyDate: null,
      etd: null,
      eta: null,
      freightCharges: null,
      otherCharges: null,
      incoterm: null,
      sampleShipment: null,
      seaDetail: null
    },
    marksAndNumber: {
      descriptionOfGoods: '',
      marksNos: '',
      containsBatteries: false
    },
    poDetails: [],
    ...overrides
  };
}

function createSubmittedPayload(): CreateBookingPayload {
  return {
    ...createDraftPayload({
      isDraft: false,
      referenceNumber: 'REF-001'
    }),
    shipper: {
      partyId: 'party-1',
      name: 'Acme Corp',
      address1: '123 Main St',
      address2: '',
      address3: '',
      address4: ''
    },
    consignee: {
      partyId: 'party-2',
      name: 'Beta Ltd',
      address1: '456 Oak Ave',
      address2: '',
      address3: '',
      address4: ''
    },
    shipmentDetail: {
      originPortId: 'port-1',
      destinationPortId: 'port-2',
      finalDestinationPortId: 'port-3',
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
      marksNos: 'PO-001 / CARTON 1-10',
      containsBatteries: false
    },
    poDetails: [
      {
        poNumber: 'PO-001',
        styleNumber: 'ST-001',
        itemNumber: 'ITEM-001',
        goodsDescription: 'Cotton T-Shirts',
        ctns: 5,
        pieces: 100,
        grossWeight: 50,
        cbm: 1.2
      }
    ]
  };
}

function createBookingRecord(
  overrides: Partial<MockBookingRecord> = {}
): MockBookingRecord {
  return {
    id: 'booking-1',
    eBookingNumber: null,
    hawbNumber: null,
    status: 'DRAFT',
    shipMode: 'AIR',
    createdAt: new Date('2026-04-30T10:00:00.000Z'),
    ...overrides
  };
}

function createPartyRecord(
  overrides: Partial<MockPartyRecord> = {}
): MockPartyRecord {
  return {
    id: 'party-1',
    ...overrides
  };
}

function createPortRecord(
  overrides: Partial<MockPortRecord> = {}
): MockPortRecord {
  return {
    id: 'port-1',
    ...overrides
  };
}

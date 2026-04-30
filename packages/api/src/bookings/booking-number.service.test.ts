import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { PrismaService } from '../database/prisma.service';
import { BookingNumberService } from './booking-number.service';

describe('BookingNumberService', () => {
  let bookingNumberService: BookingNumberService;
  let prismaService: MockPrismaService;

  beforeEach(() => {
    prismaService = createPrismaServiceMock();
    bookingNumberService = new BookingNumberService(
      prismaService as unknown as PrismaService
    );
  });

  it('formats arc booking numbers with a zero-padded daily sequence', async () => {
    const bookingNumber = await bookingNumberService.generateNextNumber(
      new Date('2026-04-30T10:00:00.000Z')
    );

    expect(bookingNumber).toBe('arc2026043000001');
  });

  it('returns unique sequential numbers for concurrent requests on the same UTC date', async () => {
    const issuedAt = new Date('2026-04-30T10:00:00.000Z');

    const [first, second] = await Promise.all([
      bookingNumberService.generateNextNumber(issuedAt),
      bookingNumberService.generateNextNumber(issuedAt)
    ]);

    expect(first).toBe('arc2026043000001');
    expect(second).toBe('arc2026043000002');
  });
});

interface MockPrismaService {
  $transaction: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
}

function createPrismaServiceMock(): MockPrismaService {
  let lastSequence = 0;
  let lock = Promise.resolve();

  const transaction = {
    $queryRaw: jest.fn(async () => [{ last_sequence: lastSequence }]),
    bookingSequence: {
      findUnique: jest.fn(async () =>
        lastSequence === 0
          ? null
          : {
              companyCode: 'arc',
              date: new Date('2026-04-30T00:00:00.000Z'),
              lastSequence
            }
      ),
      create: jest.fn(async () => {
        lastSequence = 1;
        return {
          companyCode: 'arc',
          date: new Date('2026-04-30T00:00:00.000Z'),
          lastSequence
        };
      }),
      update: jest.fn(async () => {
        lastSequence += 1;
        return {
          companyCode: 'arc',
          date: new Date('2026-04-30T00:00:00.000Z'),
          lastSequence
        };
      })
    }
  };

  const prismaService = {
    $transaction: jest.fn(async (callback: unknown) => {
      const run = lock.then(() =>
        (callback as (mockTransaction: typeof transaction) => Promise<unknown>)(
          transaction
        )
      );

      lock = run.then(
        () => undefined,
        () => undefined
      );

      return run;
    })
  };

  return prismaService;
}

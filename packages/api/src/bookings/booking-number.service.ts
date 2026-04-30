import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { BOOKING_COMPANY_CODE } from './constants';

@Injectable()
export class BookingNumberService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async generateNextNumber(issuedAt: Date = new Date()): Promise<string> {
    const sequence = await this.prismaService.$transaction(async (transaction) => {
      const sequenceDate = this.toUtcDateOnly(issuedAt);
      const dateLiteral = sequenceDate.toISOString().slice(0, 10);

      await transaction.$queryRaw(
        Prisma.sql`
          SELECT last_sequence
          FROM booking_sequences
          WHERE company_code = ${BOOKING_COMPANY_CODE}
            AND date = ${dateLiteral}::date
          FOR UPDATE
        `
      );

      const existing = await transaction.bookingSequence.findUnique({
        where: {
          companyCode_date: {
            companyCode: BOOKING_COMPANY_CODE,
            date: sequenceDate
          }
        }
      });

      if (existing === null) {
        const created = await transaction.bookingSequence.create({
          data: {
            companyCode: BOOKING_COMPANY_CODE,
            date: sequenceDate,
            lastSequence: 1
          }
        });

        return created.lastSequence;
      }

      const updated = await transaction.bookingSequence.update({
        where: {
          companyCode_date: {
            companyCode: BOOKING_COMPANY_CODE,
            date: sequenceDate
          }
        },
        data: {
          lastSequence: {
            increment: 1
          }
        }
      });

      return updated.lastSequence;
    });

    return `${BOOKING_COMPANY_CODE}${this.formatUtcDate(issuedAt)}${String(sequence).padStart(5, '0')}`;
  }

  private toUtcDateOnly(value: Date): Date {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
    );
  }

  private formatUtcDate(value: Date): string {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }
}

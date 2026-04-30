import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../database/prisma.module';
import { BookingNumberService } from './booking-number.service';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingNumberService]
})
export class BookingsModule {}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  ApiSuccessResponse,
  BookingDetails,
  BookingDraftListItem,
  BookingLookupParty,
  BookingLookupPort,
  BookingPoImportResponseData,
  BookingSummary,
  PaginationMeta
} from '@ebooking-cx/shared';

import { Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { BOOKING_ACCESS_ROLES } from './constants';
import {
  CreateBookingDto,
  ListBookingsQueryDto,
  ListPartiesQueryDto,
  ListPortsQueryDto,
  UpdateBookingDto
} from './dto';
import { BookingsService } from './bookings.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...BOOKING_ACCESS_ROLES)
@Controller('api/v1/internal')
export class BookingsController {
  public constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings')
  public async createBooking(
    @Body() body: CreateBookingDto
  ): Promise<BookingSummary> {
    return this.bookingsService.createBooking(body);
  }

  @Patch('bookings/:bookingId')
  public async updateBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: UpdateBookingDto
  ): Promise<BookingSummary> {
    return this.bookingsService.updateBooking(bookingId, body);
  }

  @Get('bookings/:bookingId')
  public async getBooking(
    @Param('bookingId') bookingId: string
  ): Promise<BookingDetails> {
    return this.bookingsService.getBooking(bookingId);
  }

  @Get('bookings')
  public async listBookings(
    @Query() query: ListBookingsQueryDto
  ): Promise<ApiSuccessResponse<BookingDraftListItem[], PaginationMeta>> {
    return this.bookingsService.listBookings(query);
  }

  @Get('parties')
  public async listParties(
    @Query() query: ListPartiesQueryDto
  ): Promise<ApiSuccessResponse<BookingLookupParty[], PaginationMeta>> {
    return this.bookingsService.listParties(query);
  }

  @Get('ports')
  public async listPorts(
    @Query() query: ListPortsQueryDto
  ): Promise<ApiSuccessResponse<BookingLookupPort[], PaginationMeta>> {
    return this.bookingsService.listPorts(query);
  }

  @Post('bookings/po-import')
  @UseInterceptors(FileInterceptor('file'))
  public async importPoFile(
    @UploadedFile() file: unknown
  ): Promise<BookingPoImportResponseData> {
    return this.bookingsService.importPoFile(file);
  }
}

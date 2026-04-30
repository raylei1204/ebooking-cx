import { Injectable, NotImplementedException } from '@nestjs/common';
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

import type {
  CreateBookingDto,
  ListBookingsQueryDto,
  ListPartiesQueryDto,
  ListPortsQueryDto,
  UpdateBookingDto
} from './dto';

@Injectable()
export class BookingsService {
  public async createBooking(_payload: CreateBookingDto): Promise<BookingSummary> {
    throw new NotImplementedException('Booking creation is not implemented yet.');
  }

  public async updateBooking(
    _bookingId: string,
    _payload: UpdateBookingDto
  ): Promise<BookingSummary> {
    throw new NotImplementedException('Booking updates are not implemented yet.');
  }

  public async getBooking(_bookingId: string): Promise<BookingDetails> {
    throw new NotImplementedException('Booking lookup is not implemented yet.');
  }

  public async listBookings(
    _query: ListBookingsQueryDto
  ): Promise<ApiSuccessResponse<BookingDraftListItem[], PaginationMeta>> {
    throw new NotImplementedException('Booking listing is not implemented yet.');
  }

  public async listParties(
    _query: ListPartiesQueryDto
  ): Promise<ApiSuccessResponse<BookingLookupParty[], PaginationMeta>> {
    throw new NotImplementedException('Party lookup is not implemented yet.');
  }

  public async listPorts(
    _query: ListPortsQueryDto
  ): Promise<ApiSuccessResponse<BookingLookupPort[], PaginationMeta>> {
    throw new NotImplementedException('Port lookup is not implemented yet.');
  }

  public async importPoFile(
    _file: unknown
  ): Promise<BookingPoImportResponseData> {
    throw new NotImplementedException('PO import parsing is not implemented yet.');
  }
}

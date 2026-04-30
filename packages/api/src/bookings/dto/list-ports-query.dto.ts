import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from 'class-validator';

import type { BookingLookupPortFilters } from '@ebooking-cx/shared';

import {
  BOOKING_DEFAULT_LIMIT,
  BOOKING_DEFAULT_PAGE
} from '../constants';

function toOptionalNumber(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return Number(value);
  }

  return value;
}

export class ListPortsQueryDto implements BookingLookupPortFilters {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  public search?: string;

  @IsOptional()
  @IsIn(['AIR', 'SEA'])
  public mode?: 'AIR' | 'SEA';

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  public page: number = BOOKING_DEFAULT_PAGE;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  public limit: number = BOOKING_DEFAULT_LIMIT;
}

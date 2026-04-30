import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import type { OrganizationListFilters } from '@ebooking-cx/shared';

function toOptionalBoolean(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}

export class ListOrganizationsQueryDto implements OrganizationListFilters {
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  public isShipper?: boolean;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  public isConsignee?: boolean;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  public isAgent?: boolean;
}

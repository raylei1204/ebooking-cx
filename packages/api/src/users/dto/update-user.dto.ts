import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from 'class-validator';

import { ROLE_NAMES } from '@ebooking-cx/shared';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  public email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  public phone?: string | null;

  @IsOptional()
  @IsBoolean()
  public isDisabled?: boolean;

  @IsOptional()
  @IsUUID()
  public organizationId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(ROLE_NAMES, { each: true })
  public roles?: Array<(typeof ROLE_NAMES)[number]>;
}

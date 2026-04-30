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

import { ROLE_NAMES, type UserPayload } from '@ebooking-cx/shared';

export class CreateUserDto implements UserPayload {
  @IsEmail()
  @MaxLength(255)
  public email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  public phone!: string | null;

  @IsBoolean()
  public isDisabled!: boolean;

  @IsOptional()
  @IsUUID()
  public organizationId!: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(ROLE_NAMES, { each: true })
  public roles!: Array<(typeof ROLE_NAMES)[number]>;
}

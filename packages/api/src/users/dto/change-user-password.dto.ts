import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import type { ChangeUserPasswordPayload } from '@ebooking-cx/shared';

export class ChangeUserPasswordDto implements ChangeUserPasswordPayload {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  public password!: string;
}

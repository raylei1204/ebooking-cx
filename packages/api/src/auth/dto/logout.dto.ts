import { IsNotEmpty, IsString } from 'class-validator';

import type { LogoutRequest } from '@ebooking-cx/shared';

export class LogoutDto implements LogoutRequest {
  @IsString()
  @IsNotEmpty()
  public refreshToken!: string;
}

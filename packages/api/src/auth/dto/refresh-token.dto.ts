import { IsNotEmpty, IsString } from 'class-validator';

import type { RefreshTokenRequest } from '@ebooking-cx/shared';

export class RefreshTokenDto implements RefreshTokenRequest {
  @IsString()
  @IsNotEmpty()
  public refreshToken!: string;
}

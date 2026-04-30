import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import type { LoginRequest } from '@ebooking-cx/shared';

export class LoginDto implements LoginRequest {
  @IsEmail()
  public email!: string;

  @IsString()
  @IsNotEmpty()
  public password!: string;
}

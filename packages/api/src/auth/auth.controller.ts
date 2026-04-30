import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { LoginResponseData, TokenResponseData } from '@ebooking-cx/shared';

import { CurrentUser } from './decorators';
import { LoginDto, LogoutDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from './guards';
import { AuthService } from './auth.service';
import type { AuthenticatedRequestUser } from './types';

@Controller('api/v1/auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('login')
  public async login(@Body() body: LoginDto): Promise<LoginResponseData> {
    return this.authService.login(body);
  }

  @Post('refresh')
  public async refresh(
    @Body() body: RefreshTokenDto
  ): Promise<TokenResponseData> {
    return this.authService.refresh(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  public async logout(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() body: LogoutDto
  ): Promise<{ success: true }> {
    return this.authService.logout(user, body);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import type {
  ApiSuccessResponse,
  CreateUserResponseData,
  UserMutationMeta,
  UserSummary
} from '@ebooking-cx/shared';

import { Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import {
  ChangeUserPasswordDto,
  CreateUserDto,
  UpdateUserDto
} from './dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/v1/internal')
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  @Get('organizations/:id/users')
  public async listOrganizationUsers(
    @Param('id') organizationId: string
  ): Promise<UserSummary[]> {
    return this.usersService.listOrganizationUsers(organizationId);
  }

  @Get('users/admins')
  public async listAdminUsers(): Promise<UserSummary[]> {
    return this.usersService.listAdminUsers();
  }

  @Post('users')
  public async createUser(
    @Body() body: CreateUserDto
  ): Promise<ApiSuccessResponse<CreateUserResponseData, UserMutationMeta>> {
    const result = await this.usersService.createUser(body);

    return {
      data: {
        user: result.user,
        temporaryPassword: result.temporaryPassword
      },
      ...(result.warnings.length > 0
        ? {
            meta: {
              warnings: result.warnings
            }
          }
        : {})
    };
  }

  @Patch('users/:id')
  public async updateUser(
    @Param('id') userId: string,
    @Body() body: UpdateUserDto
  ): Promise<ApiSuccessResponse<UserSummary, UserMutationMeta>> {
    const result = await this.usersService.updateUser(userId, body);

    return {
      data: result.user,
      ...(result.warnings.length > 0
        ? {
            meta: {
              warnings: result.warnings
            }
          }
        : {})
    };
  }

  @Delete('users/:id')
  @HttpCode(204)
  public async deleteUser(@Param('id') userId: string): Promise<void> {
    await this.usersService.deleteUser(userId);
  }

  @Patch('users/:id/password')
  public async changePassword(
    @Param('id') userId: string,
    @Body() body: ChangeUserPasswordDto
  ): Promise<{ success: true }> {
    return this.usersService.changePassword(userId, body);
  }
}

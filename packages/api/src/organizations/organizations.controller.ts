import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import type {
  OrganizationRelationshipSummary,
  OrganizationSummary
} from '@ebooking-cx/shared';

import { Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import {
  CreateOrganizationDto,
  CreateOrganizationRelationshipDto,
  ListOrganizationsQueryDto,
  UpdateOrganizationDto
} from './dto';
import { OrganizationsService } from './organizations.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/v1/internal/organizations')
export class OrganizationsController {
  public constructor(
    private readonly organizationsService: OrganizationsService
  ) {}

  @Get()
  public async listOrganizations(
    @Query() query: ListOrganizationsQueryDto
  ): Promise<OrganizationSummary[]> {
    return this.organizationsService.listOrganizations(query);
  }

  @Post()
  public async createOrganization(
    @Body() body: CreateOrganizationDto
  ): Promise<OrganizationSummary> {
    return this.organizationsService.createOrganization(body);
  }

  @Patch(':id')
  public async updateOrganization(
    @Param('id') organizationId: string,
    @Body() body: UpdateOrganizationDto
  ): Promise<OrganizationSummary> {
    return this.organizationsService.updateOrganization(organizationId, body);
  }

  @Delete(':id')
  @HttpCode(204)
  public async deleteOrganization(
    @Param('id') organizationId: string
  ): Promise<void> {
    await this.organizationsService.deleteOrganization(organizationId);
  }

  @Get(':id/relationships')
  public async listRelationships(
    @Param('id') organizationId: string
  ): Promise<OrganizationRelationshipSummary[]> {
    return this.organizationsService.listRelationships(organizationId);
  }

  @Post(':id/relationships')
  public async createRelationship(
    @Param('id') organizationId: string,
    @Body() body: CreateOrganizationRelationshipDto
  ): Promise<OrganizationRelationshipSummary> {
    return this.organizationsService.createRelationship(organizationId, body);
  }

  @Delete(':id/relationships/:relId')
  @HttpCode(204)
  public async deleteRelationship(
    @Param('id') organizationId: string,
    @Param('relId') relationshipId: string
  ): Promise<void> {
    await this.organizationsService.deleteRelationship(
      organizationId,
      relationshipId
    );
  }
}

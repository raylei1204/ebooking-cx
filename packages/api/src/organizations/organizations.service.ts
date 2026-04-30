import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import type {
  OrganizationListFilters,
  OrganizationPayload,
  OrganizationRelationshipPayload,
  OrganizationRelationshipSummary,
  OrganizationSummary
} from '@ebooking-cx/shared';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import type { UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async listOrganizations(
    filters: OrganizationListFilters
  ): Promise<OrganizationSummary[]> {
    const activeFilters: Prisma.OrganizationWhereInput[] = [];

    if (filters.isShipper === true) {
      activeFilters.push({ isShipper: true });
    }

    if (filters.isConsignee === true) {
      activeFilters.push({ isConsignee: true });
    }

    if (filters.isAgent === true) {
      activeFilters.push({ isAgent: true });
    }

    const organizations = await this.prismaService.organization.findMany({
      ...(activeFilters.length > 0
        ? {
            where: {
              OR: activeFilters
            }
          }
        : {}),
      orderBy: {
        name: 'asc'
      }
    });

    return organizations.map((organization) =>
      this.toOrganizationSummary(organization)
    );
  }

  public async createOrganization(
    payload: OrganizationPayload
  ): Promise<OrganizationSummary> {
    this.assertHasAtLeastOneType(payload);

    const organization = await this.prismaService.organization.create({
      data: payload
    });

    return this.toOrganizationSummary(organization);
  }

  public async updateOrganization(
    organizationId: string,
    payload: UpdateOrganizationDto
  ): Promise<OrganizationSummary> {
    const organization = await this.getOrganizationOrThrow(organizationId);
    this.assertHasAtLeastOneType({
      isShipper: payload.isShipper ?? organization.isShipper,
      isConsignee: payload.isConsignee ?? organization.isConsignee,
      isAgent: payload.isAgent ?? organization.isAgent
    });

    const updated = await this.prismaService.organization.update({
      where: {
        id: organizationId
      },
      data: payload
    });

    return this.toOrganizationSummary(updated);
  }

  public async deleteOrganization(organizationId: string): Promise<void> {
    await this.getOrganizationOrThrow(organizationId);

    const userCount = await this.prismaService.user.count({
      where: {
        organizationId
      }
    });

    if (userCount > 0) {
      throw new ConflictException({
        code: 'ORGANIZATION_HAS_USERS',
        message: 'Cannot delete organization with existing users.',
        statusCode: 409
      });
    }

    await this.prismaService.organization.delete({
      where: {
        id: organizationId
      }
    });
  }

  public async listRelationships(
    organizationId: string
  ): Promise<OrganizationRelationshipSummary[]> {
    await this.getOrganizationOrThrow(organizationId);

    const relationships =
      await this.prismaService.organizationRelationship.findMany({
        where: {
          OR: [{ orgIdA: organizationId }, { orgIdB: organizationId }]
        },
        include: {
          orgA: true,
          orgB: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

    return relationships.map((relationship) => ({
      id: relationship.id,
      label: relationship.label,
      relatedOrganization: this.toOrganizationSummary(
        relationship.orgIdA === organizationId ? relationship.orgB : relationship.orgA
      )
    }));
  }

  public async createRelationship(
    organizationId: string,
    payload: OrganizationRelationshipPayload
  ): Promise<OrganizationRelationshipSummary> {
    await this.getOrganizationOrThrow(organizationId);
    await this.getOrganizationOrThrow(payload.organizationId);

    if (organizationId === payload.organizationId) {
      throw new BadRequestException({
        code: 'INVALID_ORGANIZATION_RELATIONSHIP',
        message: 'An organization cannot be linked to itself.',
        statusCode: 400
      });
    }

    const [orgIdA, orgIdB] = this.normalizeRelationshipPair(
      organizationId,
      payload.organizationId
    );

    const existingRelationship =
      await this.prismaService.organizationRelationship.findFirst({
        where: {
          orgIdA,
          orgIdB
        },
        include: {
          orgA: true,
          orgB: true
        }
      });

    if (existingRelationship !== null) {
      throw new ConflictException({
        code: 'ORGANIZATION_RELATIONSHIP_EXISTS',
        message:
          'A relationship between these organizations already exists.',
        statusCode: 409
      });
    }

    const relationship = await this.prismaService.organizationRelationship.create({
      data: {
        orgIdA,
        orgIdB,
        label: payload.label
      },
      include: {
        orgA: true,
        orgB: true
      }
    });

    return {
      id: relationship.id,
      label: relationship.label,
      relatedOrganization: this.toOrganizationSummary(
        relationship.orgIdA === organizationId ? relationship.orgB : relationship.orgA
      )
    };
  }

  public async deleteRelationship(
    organizationId: string,
    relationshipId: string
  ): Promise<void> {
    await this.getOrganizationOrThrow(organizationId);

    const relationship =
      await this.prismaService.organizationRelationship.findUnique({
        where: {
          id: relationshipId
        },
        include: {
          orgA: true,
          orgB: true
        }
      });

    if (relationship === null) {
      throw new NotFoundException({
        code: 'ORGANIZATION_RELATIONSHIP_NOT_FOUND',
        message: 'Organization relationship not found.',
        statusCode: 404
      });
    }

    if (
      relationship.orgIdA !== organizationId &&
      relationship.orgIdB !== organizationId
    ) {
      throw new NotFoundException({
        code: 'ORGANIZATION_RELATIONSHIP_NOT_FOUND',
        message: 'Organization relationship not found.',
        statusCode: 404
      });
    }

    await this.prismaService.organizationRelationship.delete({
      where: {
        id: relationshipId
      }
    });
  }

  private async getOrganizationOrThrow(organizationId: string): Promise<{
    id: string;
    name: string;
    code: string | null;
    cwCode: string | null;
    isShipper: boolean;
    isConsignee: boolean;
    isAgent: boolean;
    origin: string | null;
    address1: string | null;
    address2: string | null;
    address3: string | null;
    address4: string | null;
    city: string | null;
    postal: string | null;
    country: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const organization = await this.prismaService.organization.findUnique({
      where: {
        id: organizationId
      }
    });

    if (organization === null) {
      throw new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found.',
        statusCode: 404
      });
    }

    return organization;
  }

  private assertHasAtLeastOneType(flags: {
    isShipper: boolean;
    isConsignee: boolean;
    isAgent: boolean;
  }): void {
    if (flags.isShipper || flags.isConsignee || flags.isAgent) {
      return;
    }

    throw new BadRequestException({
      code: 'ORGANIZATION_TYPE_REQUIRED',
      message:
        'At least one organization type must be selected.',
      statusCode: 400
    });
  }

  private normalizeRelationshipPair(
    organizationId: string,
    relatedOrganizationId: string
  ): [string, string] {
    return organizationId < relatedOrganizationId
      ? [organizationId, relatedOrganizationId]
      : [relatedOrganizationId, organizationId];
  }

  private toOrganizationSummary(organization: {
    id: string;
    name: string;
    code: string | null;
    cwCode: string | null;
    isShipper: boolean;
    isConsignee: boolean;
    isAgent: boolean;
    origin: string | null;
    address1: string | null;
    address2: string | null;
    address3: string | null;
    address4: string | null;
    city: string | null;
    postal: string | null;
    country: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): OrganizationSummary {
    return {
      id: organization.id,
      name: organization.name,
      code: organization.code,
      cwCode: organization.cwCode,
      isShipper: organization.isShipper,
      isConsignee: organization.isConsignee,
      isAgent: organization.isAgent,
      origin: organization.origin,
      address1: organization.address1,
      address2: organization.address2,
      address3: organization.address3,
      address4: organization.address4,
      city: organization.city,
      postal: organization.postal,
      country: organization.country,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString()
    };
  }
}

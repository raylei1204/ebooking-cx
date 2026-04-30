import {
  BadRequestException,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { PrismaService } from '../database/prisma.service';

import { OrganizationsService } from './organizations.service';

interface MockOrganizationRecord {
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
}

interface MockRelationshipRecord {
  id: string;
  orgIdA: string;
  orgIdB: string;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
  orgA: MockOrganizationRecord;
  orgB: MockOrganizationRecord;
}

describe('OrganizationsService', () => {
  let organizationsService: OrganizationsService;
  let prismaService: {
    organization: {
      findMany: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockOrganizationRecord[]>
      >;
      findUnique: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockOrganizationRecord | null>
      >;
      create: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockOrganizationRecord>
      >;
      update: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockOrganizationRecord>
      >;
      delete: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockOrganizationRecord>
      >;
    };
    organizationRelationship: {
      findMany: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockRelationshipRecord[]>
      >;
      findFirst: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockRelationshipRecord | null>
      >;
      findUnique: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockRelationshipRecord | null>
      >;
      create: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockRelationshipRecord>
      >;
      delete: jest.MockedFunction<
        (...args: unknown[]) => Promise<MockRelationshipRecord>
      >;
    };
    user: {
      count: jest.MockedFunction<(...args: unknown[]) => Promise<number>>;
    };
  };

  beforeEach(() => {
    prismaService = {
      organization: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      organizationRelationship: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn()
      },
      user: {
        count: jest.fn()
      }
    };

    organizationsService = new OrganizationsService(
      prismaService as unknown as PrismaService
    );
  });

  it('lists organizations with OR filtering across provided type flags', async () => {
    prismaService.organization.findMany.mockResolvedValue([
      createOrganizationRecord({
        id: 'org-shipper',
        isShipper: true
      })
    ]);

    await organizationsService.listOrganizations({
      isShipper: true,
      isConsignee: true
    });

    expect(prismaService.organization.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ isShipper: true }, { isConsignee: true }]
      },
      orderBy: {
        name: 'asc'
      }
    });
  });

  it('creates an organization when at least one type flag is set', async () => {
    const record = createOrganizationRecord({
      id: 'org-new',
      name: 'Kuafu'
    });
    prismaService.organization.create.mockResolvedValue(record);

    const created = await organizationsService.createOrganization({
      name: 'Kuafu',
      code: 'KUA',
      cwCode: null,
      isShipper: true,
      isConsignee: false,
      isAgent: false,
      origin: null,
      address1: null,
      address2: null,
      address3: null,
      address4: null,
      city: null,
      postal: null,
      country: null
    });

    expect(created.id).toBe('org-new');
    expect(prismaService.organization.create).toHaveBeenCalled();
  });

  it('rejects organization creation when all type flags are false', async () => {
    await expect(
      organizationsService.createOrganization({
        name: 'Invalid Org',
        code: null,
        cwCode: null,
        isShipper: false,
        isConsignee: false,
        isAgent: false,
        origin: null,
        address1: null,
        address2: null,
        address3: null,
        address4: null,
        city: null,
        postal: null,
        country: null
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects organization updates that clear every type flag', async () => {
    prismaService.organization.findUnique.mockResolvedValue(
      createOrganizationRecord({
        isShipper: true,
        isConsignee: false,
        isAgent: false
      })
    );

    await expect(
      organizationsService.updateOrganization('org-1', {
        isShipper: false,
        isConsignee: false,
        isAgent: false
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks organization deletion when users still belong to it', async () => {
    prismaService.organization.findUnique.mockResolvedValue(createOrganizationRecord());
    prismaService.user.count.mockResolvedValue(2);

    await expect(
      organizationsService.deleteOrganization('org-1')
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists relationships with related organizations normalized to the selected org', async () => {
    prismaService.organization.findUnique.mockResolvedValue(
      createOrganizationRecord({
        id: 'org-1'
      })
    );
    prismaService.organizationRelationship.findMany.mockResolvedValue([
      createRelationshipRecord({
        orgIdA: 'org-1',
        orgIdB: 'org-2',
        orgA: createOrganizationRecord({ id: 'org-1', name: 'Alpha' }),
        orgB: createOrganizationRecord({ id: 'org-2', name: 'Beta' })
      })
    ]);

    const relationships =
      await organizationsService.listRelationships('org-1');

    expect(relationships).toEqual([
      expect.objectContaining({
        id: 'rel-1',
        label: null,
        relatedOrganization: expect.objectContaining({
          id: 'org-2',
          name: 'Beta'
        })
      })
    ]);
  });

  it('rejects self-links when creating organization relationships', async () => {
    prismaService.organization.findUnique.mockResolvedValue(
      createOrganizationRecord({
        id: 'org-1'
      })
    );

    await expect(
      organizationsService.createRelationship('org-1', {
        organizationId: 'org-1',
        label: null
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate organization relationships regardless of request order', async () => {
    prismaService.organization.findUnique
      .mockResolvedValueOnce(createOrganizationRecord({ id: 'org-2' }))
      .mockResolvedValueOnce(createOrganizationRecord({ id: 'org-1' }));
    prismaService.organizationRelationship.findFirst.mockResolvedValue(
      createRelationshipRecord({
        orgIdA: 'org-1',
        orgIdB: 'org-2'
      })
    );

    await expect(
      organizationsService.createRelationship('org-2', {
        organizationId: 'org-1',
        label: 'Preferred agent'
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes a relationship only when it belongs to the selected organization', async () => {
    prismaService.organization.findUnique.mockResolvedValue(
      createOrganizationRecord({
        id: 'org-1'
      })
    );
    prismaService.organizationRelationship.findUnique.mockResolvedValue(
      createRelationshipRecord({
        id: 'rel-9',
        orgIdA: 'org-1',
        orgIdB: 'org-2'
      })
    );
    prismaService.organizationRelationship.delete.mockResolvedValue(
      createRelationshipRecord({
        id: 'rel-9',
        orgIdA: 'org-1',
        orgIdB: 'org-2'
      })
    );

    await organizationsService.deleteRelationship('org-1', 'rel-9');

    expect(prismaService.organizationRelationship.delete).toHaveBeenCalledWith({
      where: {
        id: 'rel-9'
      }
    });
  });

  it('rejects relationship deletion when the relationship is not attached to the selected organization', async () => {
    prismaService.organization.findUnique.mockResolvedValue(
      createOrganizationRecord({
        id: 'org-1'
      })
    );
    prismaService.organizationRelationship.findUnique.mockResolvedValue(
      createRelationshipRecord({
        id: 'rel-9',
        orgIdA: 'org-2',
        orgIdB: 'org-3'
      })
    );

    await expect(
      organizationsService.deleteRelationship('org-1', 'rel-9')
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createOrganizationRecord(
  overrides: Partial<MockOrganizationRecord> = {}
): MockOrganizationRecord {
  return {
    id: 'org-1',
    name: 'Organization 1',
    code: null,
    cwCode: null,
    isShipper: false,
    isConsignee: false,
    isAgent: true,
    origin: null,
    address1: null,
    address2: null,
    address3: null,
    address4: null,
    city: null,
    postal: null,
    country: null,
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    ...overrides
  };
}

function createRelationshipRecord(
  overrides: Partial<MockRelationshipRecord> = {}
): MockRelationshipRecord {
  return {
    id: 'rel-1',
    orgIdA: 'org-1',
    orgIdB: 'org-2',
    label: null,
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    orgA: createOrganizationRecord({
      id: 'org-1',
      name: 'Organization 1'
    }),
    orgB: createOrganizationRecord({
      id: 'org-2',
      name: 'Organization 2'
    }),
    ...overrides
  };
}

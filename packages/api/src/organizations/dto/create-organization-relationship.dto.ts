import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import type { OrganizationRelationshipPayload } from '@ebooking-cx/shared';

export class CreateOrganizationRelationshipDto
  implements OrganizationRelationshipPayload
{
  @IsString()
  @IsNotEmpty()
  public organizationId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public label!: string | null;
}

import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  public name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  public code?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  public cwCode?: string | null;

  @IsOptional()
  @IsBoolean()
  public isShipper?: boolean;

  @IsOptional()
  @IsBoolean()
  public isConsignee?: boolean;

  @IsOptional()
  @IsBoolean()
  public isAgent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  public origin?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public address1?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public address2?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public address3?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public address4?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  public postal?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public country?: string | null;
}

import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';

import {
  BILL_OF_LADING_REQUIREMENTS,
  CHARGE_TERMS,
  INCOTERMS,
  OPTIONAL_SERVICES,
  SEA_SHIPMENT_TYPES,
  SERVICE_REQUIREMENTS,
  SHIP_MODES,
  type CreateBookingPayload
} from '@ebooking-cx/shared';

class BookingPartyDto {
  @IsOptional()
  @IsUUID()
  public partyId!: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public name!: string;

  @IsString()
  @MaxLength(255)
  public address1!: string;

  @IsString()
  @MaxLength(255)
  public address2!: string;

  @IsString()
  @MaxLength(255)
  public address3!: string;

  @IsString()
  @MaxLength(255)
  public address4!: string;
}

class BookingContainerCountDto {
  @IsInt()
  @Min(0)
  public gp20!: number;

  @IsInt()
  @Min(0)
  public gp40!: number;

  @IsInt()
  @Min(0)
  public hq40!: number;

  @IsInt()
  @Min(0)
  public gp45!: number;
}

class BookingSeaDetailDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public exportLicenseNo!: string | null;

  @IsIn(SERVICE_REQUIREMENTS)
  public serviceRequire!: (typeof SERVICE_REQUIREMENTS)[number];

  @IsArray()
  @ArrayUnique()
  @IsIn(OPTIONAL_SERVICES, { each: true })
  public optionalServices!: Array<(typeof OPTIONAL_SERVICES)[number]>;

  @IsIn(BILL_OF_LADING_REQUIREMENTS)
  public billOfLadingRequirement!: (typeof BILL_OF_LADING_REQUIREMENTS)[number];

  @IsInt()
  @Min(0)
  public numberOfOriginalBL!: number;

  @IsIn(SEA_SHIPMENT_TYPES)
  public shipmentType!: (typeof SEA_SHIPMENT_TYPES)[number];

  @ValidateNested()
  @Type(() => BookingContainerCountDto)
  public containerCount!: BookingContainerCountDto;
}

class BookingShipmentDetailDto {
  @IsOptional()
  @IsUUID()
  public originPortId!: string | null;

  @IsOptional()
  @IsUUID()
  public destinationPortId!: string | null;

  @IsOptional()
  @IsUUID()
  public finalDestinationPortId!: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  public grossWeight!: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  public cbm!: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  public numberOfPackage!: number | null;

  @IsOptional()
  @IsString()
  public cargoReadyDate!: string | null;

  @IsOptional()
  @IsString()
  public etd!: string | null;

  @IsOptional()
  @IsString()
  public eta!: string | null;

  @IsOptional()
  @IsIn(CHARGE_TERMS)
  public freightCharges!: (typeof CHARGE_TERMS)[number] | null;

  @IsOptional()
  @IsIn(CHARGE_TERMS)
  public otherCharges!: (typeof CHARGE_TERMS)[number] | null;

  @IsOptional()
  @IsIn(INCOTERMS)
  public incoterm!: (typeof INCOTERMS)[number] | null;

  @IsOptional()
  @IsBoolean()
  public sampleShipment!: boolean | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingSeaDetailDto)
  public seaDetail!: BookingSeaDetailDto | null;
}

class BookingMarksAndNumberDto {
  @IsString()
  @MaxLength(4000)
  public descriptionOfGoods!: string;

  @IsString()
  @MaxLength(4000)
  public marksNos!: string;

  @IsBoolean()
  public containsBatteries!: boolean;
}

class BookingPoDetailDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public poNumber!: string;

  @IsString()
  @MaxLength(100)
  public styleNumber!: string;

  @IsString()
  @MaxLength(100)
  public itemNumber!: string;

  @IsString()
  @MaxLength(255)
  public goodsDescription!: string;

  @IsInt()
  @Min(0)
  public ctns!: number;

  @IsInt()
  @Min(0)
  public pieces!: number;

  @IsNumber()
  @Min(0)
  public grossWeight!: number;

  @IsNumber()
  @Min(0)
  public cbm!: number;
}

export class CreateBookingDto implements CreateBookingPayload {
  @IsBoolean()
  public isDraft!: boolean;

  @IsIn(SHIP_MODES)
  public shipMode!: (typeof SHIP_MODES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public referenceNumber?: string | null;

  @ValidateNested()
  @Type(() => BookingPartyDto)
  public shipper!: BookingPartyDto;

  @ValidateNested()
  @Type(() => BookingPartyDto)
  public consignee!: BookingPartyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingPartyDto)
  public notifyParty1!: BookingPartyDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingPartyDto)
  public notifyParty2!: BookingPartyDto | null;

  @ValidateNested()
  @Type(() => BookingShipmentDetailDto)
  public shipmentDetail!: BookingShipmentDetailDto;

  @ValidateNested()
  @Type(() => BookingMarksAndNumberDto)
  public marksAndNumber!: BookingMarksAndNumberDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingPoDetailDto)
  public poDetails!: BookingPoDetailDto[];
}

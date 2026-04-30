import {
  BadRequestException,
  Injectable,
  NotFoundException,
  NotImplementedException
} from '@nestjs/common';
import { Prisma, type BookingPartyRole, type PrismaClient } from '@prisma/client';
import type {
  ApiSuccessResponse,
  BillOfLadingRequirement,
  BookingDetails,
  BookingDraftListItem,
  BookingLookupParty,
  BookingLookupPort,
  BookingPartyPayload,
  BookingPoDetailPayload,
  BookingPoImportResponseData,
  BookingSeaDetailPayload,
  BookingShipmentDetailPayload,
  BookingStatus,
  BookingSummary,
  ChargeTerm,
  CreateBookingPayload,
  Incoterm,
  PaginationMeta,
  ServiceRequirement,
  ShipMode,
  UpdateBookingPayload
} from '@ebooking-cx/shared';

import { PrismaService } from '../database/prisma.service';
import { BookingNumberService } from './booking-number.service';
import { BOOKING_COMPANY_CODE } from './constants';
import type {
  CreateBookingDto,
  ListBookingsQueryDto,
  ListPartiesQueryDto,
  ListPortsQueryDto,
  UpdateBookingDto
} from './dto';

interface ValidationDetail {
  field: string;
  message: string;
}

interface NormalizedBookingPayload {
  isDraft: boolean;
  shipMode: ShipMode;
  referenceNumber: string | null;
  shipper: BookingPartyPayload;
  consignee: BookingPartyPayload;
  notifyParty1: BookingPartyPayload | null;
  notifyParty2: BookingPartyPayload | null;
  shipmentDetail: BookingShipmentDetailPayload;
  marksAndNumber: {
    descriptionOfGoods: string;
    marksNos: string;
    containsBatteries: boolean | null;
  };
  poDetails: BookingPoDetailPayload[];
}

type BookingTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class BookingsService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly bookingNumberService: BookingNumberService
  ) {}

  public async createBooking(
    userId: string,
    payload: CreateBookingDto
  ): Promise<BookingSummary> {
    const normalizedPayload = this.normalizePayload(payload);

    await this.assertReferencesExist(normalizedPayload);
    this.validatePayload(normalizedPayload);

    const summary = await this.prismaService.$transaction(async (transaction) => {
      const status: BookingStatus = normalizedPayload.isDraft ? 'DRAFT' : 'SUBMITTED';
      const eBookingNumber = normalizedPayload.isDraft
        ? null
        : await this.bookingNumberService.generateNextNumber();

      const booking = await transaction.booking.create({
        data: {
          companyCode: BOOKING_COMPANY_CODE,
          eBookingNumber,
          shipMode: normalizedPayload.shipMode,
          referenceNumber: normalizedPayload.referenceNumber,
          status,
          createdBy: userId
        }
      });

      await this.replaceBookingChildren(
        transaction,
        booking.id,
        normalizedPayload,
        false
      );

      return this.toBookingSummary({
        id: booking.id,
        eBookingNumber: booking.eBookingNumber,
        hawbNumber: booking.hawbNumber,
        status: booking.status,
        createdAt: booking.createdAt
      });
    });

    return summary;
  }

  public async updateBooking(
    bookingId: string,
    payload: UpdateBookingDto
  ): Promise<BookingSummary> {
    const normalizedPayload = this.normalizePayload(payload);
    const existingBooking = await this.prismaService.booking.findUnique({
      where: { id: bookingId }
    });

    if (existingBooking === null) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found.',
        statusCode: 404
      });
    }

    if (existingBooking.status !== 'DRAFT') {
      throw new BadRequestException({
        code: 'BOOKING_NOT_EDITABLE',
        message: 'Submitted bookings cannot be edited.',
        statusCode: 400
      });
    }

    await this.assertReferencesExist(normalizedPayload);
    this.validatePayload(normalizedPayload);

    const summary = await this.prismaService.$transaction(async (transaction) => {
      const status: BookingStatus = normalizedPayload.isDraft ? 'DRAFT' : 'SUBMITTED';
      const eBookingNumber = normalizedPayload.isDraft
        ? null
        : await this.bookingNumberService.generateNextNumber();

      const booking = await transaction.booking.update({
        where: { id: bookingId },
        data: {
          shipMode: normalizedPayload.shipMode,
          referenceNumber: normalizedPayload.referenceNumber,
          status,
          eBookingNumber
        }
      });

      await this.replaceBookingChildren(
        transaction,
        booking.id,
        normalizedPayload,
        true
      );

      return this.toBookingSummary({
        id: booking.id,
        eBookingNumber: booking.eBookingNumber,
        hawbNumber: booking.hawbNumber,
        status: booking.status,
        createdAt: booking.createdAt
      });
    });

    return summary;
  }

  public async getBooking(_bookingId: string): Promise<BookingDetails> {
    throw new NotImplementedException('Booking lookup is not implemented yet.');
  }

  public async listBookings(
    _query: ListBookingsQueryDto
  ): Promise<ApiSuccessResponse<BookingDraftListItem[], PaginationMeta>> {
    throw new NotImplementedException('Booking listing is not implemented yet.');
  }

  public async listParties(
    _query: ListPartiesQueryDto
  ): Promise<ApiSuccessResponse<BookingLookupParty[], PaginationMeta>> {
    throw new NotImplementedException('Party lookup is not implemented yet.');
  }

  public async listPorts(
    _query: ListPortsQueryDto
  ): Promise<ApiSuccessResponse<BookingLookupPort[], PaginationMeta>> {
    throw new NotImplementedException('Port lookup is not implemented yet.');
  }

  public async importPoFile(
    _file: unknown
  ): Promise<BookingPoImportResponseData> {
    throw new NotImplementedException('PO import parsing is not implemented yet.');
  }

  private normalizePayload(
    payload: Partial<CreateBookingPayload> | Partial<UpdateBookingPayload>
  ): NormalizedBookingPayload {
    const shipMode = payload.shipMode ?? 'AIR';
    const shipmentDetail: Partial<BookingShipmentDetailPayload> =
      payload.shipmentDetail ?? {};
    const marksAndNumber: Partial<{
      descriptionOfGoods: string;
      marksNos: string;
      containsBatteries: boolean;
    }> = payload.marksAndNumber ?? {};

    return {
      isDraft: payload.isDraft ?? false,
      shipMode,
      referenceNumber: this.normalizeNullableString(payload.referenceNumber),
      shipper: this.normalizeParty(payload.shipper),
      consignee: this.normalizeParty(payload.consignee),
      notifyParty1: this.normalizeOptionalParty(payload.notifyParty1),
      notifyParty2: this.normalizeOptionalParty(payload.notifyParty2),
      shipmentDetail: {
        originPortId: shipmentDetail.originPortId ?? null,
        destinationPortId: shipmentDetail.destinationPortId ?? null,
        finalDestinationPortId: shipmentDetail.finalDestinationPortId ?? null,
        grossWeight: shipmentDetail.grossWeight ?? null,
        cbm: shipmentDetail.cbm ?? null,
        numberOfPackage: shipmentDetail.numberOfPackage ?? null,
        cargoReadyDate: shipmentDetail.cargoReadyDate ?? null,
        etd: shipmentDetail.etd ?? null,
        eta: shipmentDetail.eta ?? null,
        freightCharges: shipmentDetail.freightCharges ?? null,
        otherCharges: shipmentDetail.otherCharges ?? null,
        incoterm: shipmentDetail.incoterm ?? null,
        sampleShipment: shipmentDetail.sampleShipment ?? null,
        seaDetail: this.normalizeSeaDetail(shipMode, shipmentDetail.seaDetail)
      },
      marksAndNumber: {
        descriptionOfGoods: marksAndNumber.descriptionOfGoods ?? '',
        marksNos: marksAndNumber.marksNos ?? '',
        containsBatteries: marksAndNumber.containsBatteries ?? null
      },
      poDetails: (payload.poDetails ?? []).map((row) => ({
        poNumber: row.poNumber ?? '',
        styleNumber: row.styleNumber ?? '',
        itemNumber: row.itemNumber ?? '',
        goodsDescription: row.goodsDescription ?? '',
        ctns: row.ctns ?? 0,
        pieces: row.pieces ?? 0,
        grossWeight: row.grossWeight ?? 0,
        cbm: row.cbm ?? 0
      }))
    };
  }

  private normalizeParty(party?: BookingPartyPayload | null): BookingPartyPayload {
    return {
      partyId: party?.partyId ?? null,
      name: party?.name ?? '',
      address1: party?.address1 ?? '',
      address2: party?.address2 ?? '',
      address3: party?.address3 ?? '',
      address4: party?.address4 ?? ''
    };
  }

  private normalizeOptionalParty(
    party?: BookingPartyPayload | null
  ): BookingPartyPayload | null {
    if (party === null || party === undefined) {
      return null;
    }

    return this.normalizeParty(party);
  }

  private normalizeSeaDetail(
    shipMode: ShipMode,
    seaDetail?: BookingSeaDetailPayload | null
  ): BookingSeaDetailPayload | null {
    if (shipMode !== 'SEA' || seaDetail === null || seaDetail === undefined) {
      return null;
    }

    return {
      exportLicenseNo: this.normalizeNullableString(seaDetail.exportLicenseNo),
      serviceRequire: seaDetail.serviceRequire,
      optionalServices: seaDetail.optionalServices ?? [],
      billOfLadingRequirement: seaDetail.billOfLadingRequirement,
      numberOfOriginalBL: seaDetail.numberOfOriginalBL ?? 0,
      shipmentType: seaDetail.shipmentType,
      containerCount: {
        gp20: seaDetail.containerCount?.gp20 ?? 0,
        gp40: seaDetail.containerCount?.gp40 ?? 0,
        hq40: seaDetail.containerCount?.hq40 ?? 0,
        gp45: seaDetail.containerCount?.gp45 ?? 0
      }
    };
  }

  private normalizeNullableString(value?: string | null): string | null {
    if (value === undefined || value === null || value.trim() === '') {
      return null;
    }

    return value;
  }

  private validatePayload(payload: NormalizedBookingPayload): void {
    const errors: ValidationDetail[] = [];

    this.validatePoDetails(payload.poDetails, errors);
    this.validateShipmentNumbers(payload.shipmentDetail, errors);
    this.validateShipmentDates(payload.shipmentDetail, errors);

    if (!payload.isDraft) {
      this.validateSubmitRequirements(payload, errors);
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        statusCode: 400,
        details: errors
      });
    }
  }

  private validatePoDetails(
    poDetails: BookingPoDetailPayload[],
    errors: ValidationDetail[]
  ): void {
    poDetails.forEach((row, index) => {
      const prefix = `poDetails.${index}`;

      if (row.poNumber.trim() === '') {
        errors.push({
          field: `${prefix}.poNumber`,
          message: 'PO Number is required when a PO row exists.'
        });
      }

      if (!Number.isInteger(row.ctns) || row.ctns < 0) {
        errors.push({
          field: `${prefix}.ctns`,
          message: 'CTNS must be a non-negative integer.'
        });
      }

      if (!Number.isInteger(row.pieces) || row.pieces < 0) {
        errors.push({
          field: `${prefix}.pieces`,
          message: 'Pieces must be a non-negative integer.'
        });
      }

      if (row.grossWeight < 0) {
        errors.push({
          field: `${prefix}.grossWeight`,
          message: 'Gross Weight must be a non-negative number.'
        });
      }

      if (row.cbm < 0) {
        errors.push({
          field: `${prefix}.cbm`,
          message: 'CBM must be a non-negative number.'
        });
      }
    });
  }

  private validateShipmentNumbers(
    shipmentDetail: BookingShipmentDetailPayload,
    errors: ValidationDetail[]
  ): void {
    if (
      shipmentDetail.grossWeight !== null &&
      shipmentDetail.grossWeight <= 0
    ) {
      errors.push({
        field: 'shipmentDetail.grossWeight',
        message: 'Gross Weight must be greater than 0.'
      });
    }

    if (shipmentDetail.cbm !== null && shipmentDetail.cbm <= 0) {
      errors.push({
        field: 'shipmentDetail.cbm',
        message: 'CBM must be greater than 0.'
      });
    }

    if (
      shipmentDetail.numberOfPackage !== null &&
      (!Number.isInteger(shipmentDetail.numberOfPackage) ||
        shipmentDetail.numberOfPackage <= 0)
    ) {
      errors.push({
        field: 'shipmentDetail.numberOfPackage',
        message: 'Number of Package must be a positive integer.'
      });
    }
  }

  private validateShipmentDates(
    shipmentDetail: BookingShipmentDetailPayload,
    errors: ValidationDetail[]
  ): void {
    const cargoReadyDate = this.parseDateOnly(shipmentDetail.cargoReadyDate);
    const etd = this.parseDateOnly(shipmentDetail.etd);
    const eta = this.parseDateOnly(shipmentDetail.eta);

    if (
      cargoReadyDate !== null &&
      etd !== null &&
      etd.getTime() < cargoReadyDate.getTime()
    ) {
      errors.push({
        field: 'shipmentDetail.etd',
        message: 'ETD must not be before Cargo Ready Date.'
      });
    }

    if (etd !== null && eta !== null && eta.getTime() < etd.getTime()) {
      errors.push({
        field: 'shipmentDetail.eta',
        message: 'ETA must not be before ETD.'
      });
    }
  }

  private validateSubmitRequirements(
    payload: NormalizedBookingPayload,
    errors: ValidationDetail[]
  ): void {
    if (payload.shipper.name.trim() === '') {
      errors.push({
        field: 'shipper.name',
        message: 'Shipper is required.'
      });
    }

    if (payload.consignee.name.trim() === '') {
      errors.push({
        field: 'consignee.name',
        message: 'Consignee is required.'
      });
    }

    if (payload.shipmentDetail.originPortId === null) {
      errors.push({
        field: 'shipmentDetail.originPortId',
        message: 'Origin is required.'
      });
    }

    if (payload.shipmentDetail.destinationPortId === null) {
      errors.push({
        field: 'shipmentDetail.destinationPortId',
        message: 'Destination is required.'
      });
    }

    if (payload.shipmentDetail.grossWeight === null) {
      errors.push({
        field: 'shipmentDetail.grossWeight',
        message: 'Gross Weight is required.'
      });
    }

    if (payload.shipmentDetail.cbm === null) {
      errors.push({
        field: 'shipmentDetail.cbm',
        message: 'CBM is required.'
      });
    }

    if (payload.shipmentDetail.numberOfPackage === null) {
      errors.push({
        field: 'shipmentDetail.numberOfPackage',
        message: 'Number of Package is required.'
      });
    }

    if (payload.shipmentDetail.cargoReadyDate === null) {
      errors.push({
        field: 'shipmentDetail.cargoReadyDate',
        message: 'Cargo Ready Date is required.'
      });
    }

    if (payload.shipmentDetail.etd === null) {
      errors.push({
        field: 'shipmentDetail.etd',
        message: 'ETD is required.'
      });
    }

    if (payload.shipmentDetail.eta === null) {
      errors.push({
        field: 'shipmentDetail.eta',
        message: 'ETA is required.'
      });
    }

    if (payload.shipmentDetail.freightCharges === null) {
      errors.push({
        field: 'shipmentDetail.freightCharges',
        message: 'Freight Charges is required.'
      });
    }

    if (payload.shipmentDetail.incoterm === null) {
      errors.push({
        field: 'shipmentDetail.incoterm',
        message: 'Incoterm is required.'
      });
    }

    if (payload.shipmentDetail.sampleShipment === null) {
      errors.push({
        field: 'shipmentDetail.sampleShipment',
        message: 'Sample Shipment is required.'
      });
    }

    if (payload.marksAndNumber.containsBatteries === null) {
      errors.push({
        field: 'marksAndNumber.containsBatteries',
        message: 'Battery declaration is required.'
      });
    }

    if (payload.shipMode === 'SEA') {
      const seaDetail = payload.shipmentDetail.seaDetail;

      if (seaDetail === null) {
        errors.push({
          field: 'shipmentDetail.seaDetail',
          message: 'Sea detail is required for sea bookings.'
        });
        return;
      }

      if (seaDetail.serviceRequire === undefined) {
        errors.push({
          field: 'shipmentDetail.seaDetail.serviceRequire',
          message: 'Service Require is required.'
        });
      }

      if (seaDetail.shipmentType === undefined) {
        errors.push({
          field: 'shipmentDetail.seaDetail.shipmentType',
          message: 'Shipment Type is required.'
        });
      }

      if (
        seaDetail.shipmentType === 'FCL' &&
        seaDetail.containerCount.gp20 +
          seaDetail.containerCount.gp40 +
          seaDetail.containerCount.hq40 +
          seaDetail.containerCount.gp45 ===
          0
      ) {
        errors.push({
          field: 'shipmentDetail.seaDetail.containerCount',
          message: 'At least one container count must be greater than 0 for FCL shipments.'
        });
      }
    }
  }

  private async assertReferencesExist(payload: NormalizedBookingPayload): Promise<void> {
    const partyIds = [
      payload.shipper.partyId,
      payload.consignee.partyId,
      payload.notifyParty1?.partyId ?? null,
      payload.notifyParty2?.partyId ?? null
    ].filter((partyId): partyId is string => partyId !== null);

    if (partyIds.length > 0) {
      const parties = await this.prismaService.party.findMany({
        where: {
          id: {
            in: partyIds
          }
        },
        select: {
          id: true
        }
      });

      if (parties.length !== new Set(partyIds).size) {
        throw new NotFoundException({
          code: 'PARTY_NOT_FOUND',
          message: 'Referenced party does not exist.',
          statusCode: 404
        });
      }
    }

    const portIds = [
      payload.shipmentDetail.originPortId,
      payload.shipmentDetail.destinationPortId,
      payload.shipmentDetail.finalDestinationPortId
    ].filter((portId): portId is string => portId !== null);

    if (portIds.length > 0) {
      const ports = await this.prismaService.portInfo.findMany({
        where: {
          id: {
            in: portIds
          }
        },
        select: {
          id: true
        }
      });

      if (ports.length !== new Set(portIds).size) {
        throw new NotFoundException({
          code: 'PORT_NOT_FOUND',
          message: 'Referenced port does not exist.',
          statusCode: 404
        });
      }
    }
  }

  private async replaceBookingChildren(
    transaction: BookingTransactionClient,
    bookingId: string,
    payload: NormalizedBookingPayload,
    isUpdate: boolean
  ): Promise<void> {
    await transaction.bookingParty.deleteMany({
      where: {
        bookingId
      }
    });
    await transaction.bookingPoDetail.deleteMany({
      where: {
        bookingId
      }
    });
    await transaction.bookingShipmentDetail.deleteMany({
      where: {
        bookingId
      }
    });
    await transaction.bookingMark.deleteMany({
      where: {
        bookingId
      }
    });
    await transaction.bookingSeaDetail.deleteMany({
      where: {
        bookingId
      }
    });

    const parties = this.buildParties(payload);
    if (parties.length > 0) {
      await transaction.bookingParty.createMany({
        data: parties.map((party) => ({
          bookingId,
          role: party.role,
          partyId: party.party.partyId,
          name: party.party.name,
          address1: this.emptyStringToNull(party.party.address1),
          address2: this.emptyStringToNull(party.party.address2),
          address3: this.emptyStringToNull(party.party.address3),
          address4: this.emptyStringToNull(party.party.address4)
        }))
      });
    }

    if (this.shouldPersistShipmentDetail(payload.shipmentDetail, payload.isDraft)) {
      const weights = this.computeWeights(
        payload.shipMode,
        payload.shipmentDetail.grossWeight,
        payload.shipmentDetail.cbm
      );

      await transaction.bookingShipmentDetail.create({
        data: {
          bookingId,
          originPortId: payload.shipmentDetail.originPortId,
          destinationPortId: payload.shipmentDetail.destinationPortId,
          finalDestinationPortId: payload.shipmentDetail.finalDestinationPortId,
          grossWeight: this.toDecimal(payload.shipmentDetail.grossWeight, 2),
          cbm: this.toDecimal(payload.shipmentDetail.cbm, 3),
          volumeWeight: this.toDecimal(weights.volumeWeight, 2),
          chargeableWeight: this.toDecimal(weights.chargeableWeight, 2),
          numberOfPackage: payload.shipmentDetail.numberOfPackage,
          cargoReadyDate: this.parseDateOnly(payload.shipmentDetail.cargoReadyDate),
          etd: this.parseDateOnly(payload.shipmentDetail.etd),
          eta: this.parseDateOnly(payload.shipmentDetail.eta),
          freightCharges: payload.shipmentDetail.freightCharges as ChargeTerm | null,
          otherCharges: payload.shipmentDetail.otherCharges as ChargeTerm | null,
          incoterm: payload.shipmentDetail.incoterm as Incoterm | null,
          sampleShipment: payload.shipmentDetail.sampleShipment
        }
      });
    }

    if (this.shouldPersistMarks(payload.marksAndNumber, payload.isDraft)) {
      await transaction.bookingMark.create({
        data: {
          bookingId,
          descriptionOfGoods: this.emptyStringToNull(
            payload.marksAndNumber.descriptionOfGoods
          ),
          marksNos: this.emptyStringToNull(payload.marksAndNumber.marksNos),
          containsBatteries: payload.marksAndNumber.containsBatteries
        }
      });
    }

    if (payload.shipMode === 'SEA' && payload.shipmentDetail.seaDetail !== null) {
      const seaDetail = payload.shipmentDetail.seaDetail;
      const containerCount =
        seaDetail.shipmentType === 'LCL'
          ? { gp20: 0, gp40: 0, hq40: 0, gp45: 0 }
          : seaDetail.containerCount;

      await transaction.bookingSeaDetail.create({
        data: {
          bookingId,
          exportLicenseNo: seaDetail.exportLicenseNo,
          serviceRequire: this.toPrismaServiceRequirement(seaDetail.serviceRequire),
          optionalServices: seaDetail.optionalServices,
          billOfLadingRequirement: this.toPrismaBillOfLadingRequirement(
            seaDetail.billOfLadingRequirement
          ),
          numberOfOriginalBl: seaDetail.numberOfOriginalBL,
          shipmentType: seaDetail.shipmentType,
          containerGp20: containerCount.gp20,
          containerGp40: containerCount.gp40,
          containerHq40: containerCount.hq40,
          containerGp45: containerCount.gp45
        }
      });
    }

    if (payload.poDetails.length > 0) {
      await transaction.bookingPoDetail.createMany({
        data: payload.poDetails.map((row, index) => ({
          bookingId,
          rowNumber: index + 1,
          poNumber: row.poNumber,
          styleNumber: this.emptyStringToNull(row.styleNumber),
          itemNumber: this.emptyStringToNull(row.itemNumber),
          goodsDescription: this.emptyStringToNull(row.goodsDescription),
          ctns: row.ctns,
          pieces: row.pieces,
          grossWeight: this.toDecimal(row.grossWeight, 2),
          cbm: this.toDecimal(row.cbm, 3)
        }))
      });
    }

    if (isUpdate && payload.shipMode === 'AIR') {
      await transaction.bookingSeaDetail.deleteMany({
        where: {
          bookingId
        }
      });
    }
  }

  private buildParties(
    payload: NormalizedBookingPayload
  ): Array<{ role: BookingPartyRole; party: BookingPartyPayload }> {
    const parties: Array<{ role: BookingPartyRole; party: BookingPartyPayload }> = [];

    if (this.hasPartyContent(payload.shipper)) {
      parties.push({ role: 'SHIPPER', party: payload.shipper });
    }

    if (this.hasPartyContent(payload.consignee)) {
      parties.push({ role: 'CONSIGNEE', party: payload.consignee });
    }

    if (payload.notifyParty1 !== null && this.hasPartyContent(payload.notifyParty1)) {
      parties.push({ role: 'NOTIFY_1', party: payload.notifyParty1 });
    }

    if (payload.notifyParty2 !== null && this.hasPartyContent(payload.notifyParty2)) {
      parties.push({ role: 'NOTIFY_2', party: payload.notifyParty2 });
    }

    return parties;
  }

  private hasPartyContent(party: BookingPartyPayload): boolean {
    return (
      party.partyId !== null ||
      party.name.trim() !== '' ||
      party.address1.trim() !== '' ||
      party.address2.trim() !== '' ||
      party.address3.trim() !== '' ||
      party.address4.trim() !== ''
    );
  }

  private shouldPersistShipmentDetail(
    shipmentDetail: BookingShipmentDetailPayload,
    isDraft: boolean
  ): boolean {
    return (
      !isDraft ||
      shipmentDetail.originPortId !== null ||
      shipmentDetail.destinationPortId !== null ||
      shipmentDetail.finalDestinationPortId !== null ||
      shipmentDetail.grossWeight !== null ||
      shipmentDetail.cbm !== null ||
      shipmentDetail.numberOfPackage !== null ||
      shipmentDetail.cargoReadyDate !== null ||
      shipmentDetail.etd !== null ||
      shipmentDetail.eta !== null ||
      shipmentDetail.freightCharges !== null ||
      shipmentDetail.otherCharges !== null ||
      shipmentDetail.incoterm !== null ||
      shipmentDetail.sampleShipment !== null
    );
  }

  private shouldPersistMarks(
    marks: NormalizedBookingPayload['marksAndNumber'],
    isDraft: boolean
  ): boolean {
    return (
      !isDraft ||
      marks.descriptionOfGoods.trim() !== '' ||
      marks.marksNos.trim() !== ''
    );
  }

  private computeWeights(
    shipMode: ShipMode,
    grossWeight: number | null,
    cbm: number | null
  ): {
    volumeWeight: number | null;
    chargeableWeight: number | null;
  } {
    const volumeWeight =
      cbm === null
        ? null
        : this.roundToTwoDecimals(cbm * (shipMode === 'AIR' ? 166.67 : 1000));
    const candidates = [grossWeight, volumeWeight].filter(
      (value): value is number => value !== null
    );

    return {
      volumeWeight,
      chargeableWeight:
        candidates.length === 0
          ? null
          : this.roundToTwoDecimals(Math.max(...candidates))
    };
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toDecimal(value: number | null, scale: 2 | 3): Prisma.Decimal | null {
    if (value === null) {
      return null;
    }

    const normalized =
      scale === 2 ? this.roundToTwoDecimals(value) : Math.round(value * 1000) / 1000;

    return new Prisma.Decimal(normalized);
  }

  private emptyStringToNull(value: string): string | null {
    return value.trim() === '' ? null : value;
  }

  private parseDateOnly(value: string | null): Date | null {
    if (value === null) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private toPrismaServiceRequirement(
    value: ServiceRequirement
  ): 'CFS_CFS' | 'CFS_CY' | 'CY_CFS' | 'CY_CY' {
    if (value === 'CFS/CFS') {
      return 'CFS_CFS';
    }

    if (value === 'CFS/CY') {
      return 'CFS_CY';
    }

    if (value === 'CY/CFS') {
      return 'CY_CFS';
    }

    return 'CY_CY';
  }

  private toPrismaBillOfLadingRequirement(
    value: BillOfLadingRequirement
  ): 'SHIPPED_ON_BOARD' | 'RECEIVED_FOR_SHIPMENT' {
    return value;
  }

  private toBookingSummary(record: {
    id: string;
    eBookingNumber: string | null;
    hawbNumber: string | null;
    status: string;
    createdAt: Date;
  }): BookingSummary {
    return {
      bookingId: record.id,
      eBookingNumber: record.eBookingNumber,
      hawbNumber: record.hawbNumber,
      status: record.status as BookingStatus,
      createdAt: record.createdAt.toISOString()
    };
  }
}

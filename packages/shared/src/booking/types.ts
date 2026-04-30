export const SHIP_MODES = ['AIR', 'SEA'] as const;
export type ShipMode = (typeof SHIP_MODES)[number];

export const BOOKING_STATUSES = ['DRAFT', 'SUBMITTED', 'CANCELLED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const CHARGE_TERMS = ['PREPAID', 'COLLECT'] as const;
export type ChargeTerm = (typeof CHARGE_TERMS)[number];

export const INCOTERMS = ['CFR', 'CIF', 'CIP', 'TBD'] as const;
export type Incoterm = (typeof INCOTERMS)[number];

export const SERVICE_REQUIREMENTS = [
  'CFS/CFS',
  'CFS/CY',
  'CY/CFS',
  'CY/CY'
] as const;
export type ServiceRequirement = (typeof SERVICE_REQUIREMENTS)[number];

export const OPTIONAL_SERVICES = [
  'PICKUP',
  'HAULAGE',
  'REPACK',
  'DECLARATION',
  'INSURANCE'
] as const;
export type OptionalService = (typeof OPTIONAL_SERVICES)[number];

export const BILL_OF_LADING_REQUIREMENTS = [
  'SHIPPED_ON_BOARD',
  'RECEIVED_FOR_SHIPMENT'
] as const;
export type BillOfLadingRequirement =
  (typeof BILL_OF_LADING_REQUIREMENTS)[number];

export const SEA_SHIPMENT_TYPES = ['FCL', 'LCL'] as const;
export type SeaShipmentType = (typeof SEA_SHIPMENT_TYPES)[number];

export const PORT_SEARCH_MODES = ['AIR', 'SEA', 'BOTH'] as const;
export type PortSearchMode = (typeof PORT_SEARCH_MODES)[number];

export interface BookingPartyPayload {
  partyId: string | null;
  name: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
}

export interface BookingContainerCountPayload {
  gp20: number;
  gp40: number;
  hq40: number;
  gp45: number;
}

export interface BookingSeaDetailPayload {
  exportLicenseNo: string | null;
  serviceRequire: ServiceRequirement;
  optionalServices: OptionalService[];
  billOfLadingRequirement: BillOfLadingRequirement;
  numberOfOriginalBL: number;
  shipmentType: SeaShipmentType;
  containerCount: BookingContainerCountPayload;
}

export interface BookingShipmentDetailPayload {
  originPortId: string | null;
  destinationPortId: string | null;
  finalDestinationPortId: string | null;
  grossWeight: number | null;
  cbm: number | null;
  numberOfPackage: number | null;
  cargoReadyDate: string | null;
  etd: string | null;
  eta: string | null;
  freightCharges: ChargeTerm | null;
  otherCharges: ChargeTerm | null;
  incoterm: Incoterm | null;
  sampleShipment: boolean | null;
  seaDetail: BookingSeaDetailPayload | null;
}

export interface BookingMarksAndNumberPayload {
  descriptionOfGoods: string;
  marksNos: string;
  containsBatteries: boolean;
}

export interface BookingPoDetailPayload {
  poNumber: string;
  styleNumber: string;
  itemNumber: string;
  goodsDescription: string;
  ctns: number;
  pieces: number;
  grossWeight: number;
  cbm: number;
}

export interface CreateBookingPayload {
  isDraft: boolean;
  shipMode: ShipMode;
  referenceNumber?: string | null;
  shipper: BookingPartyPayload;
  consignee: BookingPartyPayload;
  notifyParty1: BookingPartyPayload | null;
  notifyParty2: BookingPartyPayload | null;
  shipmentDetail: BookingShipmentDetailPayload;
  marksAndNumber: BookingMarksAndNumberPayload;
  poDetails: BookingPoDetailPayload[];
}

export interface UpdateBookingPayload extends CreateBookingPayload {}

export interface BookingSummary {
  bookingId: string;
  eBookingNumber: string | null;
  hawbNumber: string | null;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingDetails extends BookingSummary {
  shipMode: ShipMode;
  referenceNumber: string | null;
  shipper: BookingPartyPayload;
  consignee: BookingPartyPayload;
  notifyParty1: BookingPartyPayload | null;
  notifyParty2: BookingPartyPayload | null;
  shipmentDetail: BookingShipmentDetailPayload;
  marksAndNumber: BookingMarksAndNumberPayload;
  poDetails: BookingPoDetailPayload[];
}

export interface BookingDraftListFilters {
  status?: Extract<BookingStatus, 'DRAFT'>;
  page?: number;
  limit?: number;
}

export interface BookingDraftListItem {
  bookingId: string;
  referenceNumber: string | null;
  shipMode: ShipMode;
  shipperName: string;
  createdAt: string;
}

export interface BookingLookupPartyFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface BookingLookupParty {
  partyId: string;
  name: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
}

export interface BookingLookupPortFilters {
  search?: string;
  mode?: Extract<PortSearchMode, 'AIR' | 'SEA'>;
  page?: number;
  limit?: number;
}

export interface BookingLookupPort {
  portId: string;
  code: string;
  name: string;
  country: string;
  mode: Extract<PortSearchMode, 'AIR' | 'SEA'>;
}

export interface BookingPoImportRow extends BookingPoDetailPayload {
  rowIndex: number;
}

export interface BookingPoImportParseError {
  rowIndex: number;
  field: keyof BookingPoDetailPayload;
  message: string;
}

export interface BookingPoImportResponseData {
  rows: BookingPoImportRow[];
  parseErrors: BookingPoImportParseError[];
}

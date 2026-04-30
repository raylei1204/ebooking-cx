import { describe, expect, it } from '@jest/globals';
import {
  BILL_OF_LADING_REQUIREMENTS,
  BOOKING_STATUSES,
  OPTIONAL_SERVICES,
  SHIP_MODES,
  ROLE_NAMES,
  SERVICE_REQUIREMENTS,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type AuthenticatedUserSummary,
  type BookingDraftListItem,
  type BookingLookupParty,
  type BookingLookupPort,
  type BookingPoImportResponseData,
  type BookingSummary,
  type CreateBookingPayload,
  type LoginRequest,
  type LoginResponseData,
  type OrganizationSummary,
  type UserSummary
} from '@ebooking-cx/shared';

describe('shared contracts', () => {
  it('exports the auth, organization, user, response, and booking contract surface', () => {
    const user: AuthenticatedUserSummary = {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      organizationId: null,
      roles: ['admin']
    };

    const loginRequest: LoginRequest = {
      email: 'admin@example.com',
      password: 'secret'
    };

    const loginResponse: ApiSuccessResponse<LoginResponseData> = {
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user
      }
    };

    const organization: OrganizationSummary = {
      id: 'org-1',
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
      country: null,
      createdAt: '2026-04-30T00:00:00.000Z',
      updatedAt: '2026-04-30T00:00:00.000Z'
    };

    const accountUser: UserSummary = {
      id: 'user-2',
      email: 'user@example.com',
      name: 'Mikey',
      phone: null,
      isDisabled: false,
      organizationId: organization.id,
      roles: ['shipper'],
      createdAt: '2026-04-30T00:00:00.000Z',
      updatedAt: '2026-04-30T00:00:00.000Z'
    };

    const bookingPayload: CreateBookingPayload = {
      isDraft: false,
      shipMode: 'AIR',
      referenceNumber: 'REF-001',
      shipper: {
        partyId: 'party-1',
        name: 'Acme Corp',
        address1: '123 Main St',
        address2: '',
        address3: '',
        address4: ''
      },
      consignee: {
        partyId: 'party-2',
        name: 'Beta Ltd',
        address1: '456 Oak Ave',
        address2: '',
        address3: '',
        address4: ''
      },
      notifyParty1: null,
      notifyParty2: null,
      shipmentDetail: {
        originPortId: 'port-1',
        destinationPortId: 'port-2',
        finalDestinationPortId: null,
        grossWeight: 100.5,
        cbm: 2.3,
        numberOfPackage: 10,
        cargoReadyDate: '2026-06-01',
        etd: '2026-06-05',
        eta: '2026-06-12',
        freightCharges: 'PREPAID',
        otherCharges: 'COLLECT',
        incoterm: 'CIF',
        sampleShipment: false,
        seaDetail: null
      },
      marksAndNumber: {
        descriptionOfGoods: 'Textile goods',
        marksNos: 'PO-001 / CARTON 1-10',
        containsBatteries: false
      },
      poDetails: [
        {
          poNumber: 'PO-001',
          styleNumber: 'ST-001',
          itemNumber: 'ITEM-001',
          goodsDescription: 'Cotton T-Shirts',
          ctns: 5,
          pieces: 100,
          grossWeight: 50,
          cbm: 1.2
        }
      ]
    };

    const bookingSummary: BookingSummary = {
      bookingId: 'booking-1',
      eBookingNumber: 'arc2026043000001',
      hawbNumber: null,
      status: 'SUBMITTED',
      createdAt: '2026-04-30T10:00:00.000Z'
    };

    const draftItem: BookingDraftListItem = {
      bookingId: 'booking-2',
      referenceNumber: 'REF-002',
      shipMode: 'SEA',
      shipperName: 'Acme Corp',
      createdAt: '2026-04-30T10:00:00.000Z'
    };

    const partyLookup: BookingLookupParty = {
      partyId: 'party-1',
      name: 'Acme Corp',
      address1: '123 Main St',
      address2: '',
      address3: '',
      address4: ''
    };

    const portLookup: BookingLookupPort = {
      portId: 'port-1',
      code: 'SGSIN',
      name: 'Port of Singapore',
      country: 'SG',
      mode: 'SEA'
    };

    const poImportResponse: ApiSuccessResponse<BookingPoImportResponseData> = {
      data: {
        rows: [
          {
            rowIndex: 2,
            poNumber: 'PO-001',
            styleNumber: 'ST-001',
            itemNumber: 'ITEM-001',
            goodsDescription: 'Cotton T-Shirts',
            ctns: 5,
            pieces: 100,
            grossWeight: 50,
            cbm: 1.2
          }
        ],
        parseErrors: [
          {
            rowIndex: 4,
            field: 'ctns',
            message: 'Must be a non-negative integer.'
          }
        ]
      }
    };

    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'SHIPMENT_NOT_FOUND',
        message: 'No shipment found with the given ID.',
        statusCode: 404
      }
    };

    expect(ROLE_NAMES).toEqual(['admin', 'shipper', 'consignee', 'agent']);
    expect(SHIP_MODES).toEqual(['AIR', 'SEA']);
    expect(BOOKING_STATUSES).toEqual(['DRAFT', 'SUBMITTED', 'CANCELLED']);
    expect(SERVICE_REQUIREMENTS).toEqual(['CFS/CFS', 'CFS/CY', 'CY/CFS', 'CY/CY']);
    expect(OPTIONAL_SERVICES).toEqual([
      'PICKUP',
      'HAULAGE',
      'REPACK',
      'DECLARATION',
      'INSURANCE'
    ]);
    expect(BILL_OF_LADING_REQUIREMENTS).toEqual([
      'SHIPPED_ON_BOARD',
      'RECEIVED_FOR_SHIPMENT'
    ]);
    expect(loginRequest.email).toBe('admin@example.com');
    expect(loginResponse.data.user).toEqual(user);
    expect(accountUser.roles).toEqual(['shipper']);
    expect(bookingPayload.shipmentDetail.freightCharges).toBe('PREPAID');
    expect(bookingSummary.status).toBe('SUBMITTED');
    expect(draftItem.shipMode).toBe('SEA');
    expect(partyLookup.partyId).toBe('party-1');
    expect(portLookup.mode).toBe('SEA');
    expect(poImportResponse.data.parseErrors).toHaveLength(1);
    expect(errorResponse.error.statusCode).toBe(404);
  });
});

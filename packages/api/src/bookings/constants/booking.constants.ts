export const BOOKING_ACCESS_ROLES = ['shipper', 'admin'] as const;
// v1 hardcodes ARC until company code moves onto the authenticated user model.
export const BOOKING_COMPANY_CODE = 'arc' as const;

export const BOOKING_DEFAULT_PAGE = 1;
export const BOOKING_DEFAULT_LIMIT = 20;
export const BOOKING_PO_IMPORT_MAX_FILE_SIZE_BYTES = 500 * 1024;
export const BOOKING_PO_IMPORT_MAX_ROWS = 500;

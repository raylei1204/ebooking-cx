import { HttpStatus } from '@nestjs/common';

const DEFAULT_ERROR_CODE = 'INTERNAL_SERVER_ERROR';

const HTTP_ERROR_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.INTERNAL_SERVER_ERROR]: DEFAULT_ERROR_CODE
};

export function getHttpErrorCode(statusCode: number): string {
  return HTTP_ERROR_CODES[statusCode] ?? DEFAULT_ERROR_CODE;
}

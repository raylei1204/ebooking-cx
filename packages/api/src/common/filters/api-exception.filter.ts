import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import type { Response } from 'express';

import { getHttpErrorCode } from '../constants/http-error-codes';

interface ErrorBody {
  code: string;
  message: string;
  statusCode: number;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const errorBody = this.getErrorBody(exception);

    response.status(errorBody.statusCode).json({
      error: errorBody
    });
  }

  private getErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (this.isErrorBody(response)) {
        return response;
      }

      if (typeof response === 'string') {
        return {
          code: getHttpErrorCode(statusCode),
          message: response,
          statusCode
        };
      }

      if (this.hasMessage(response)) {
        return {
          code: getHttpErrorCode(statusCode),
          message: response.message,
          statusCode
        };
      }

      return {
        code: getHttpErrorCode(statusCode),
        message: exception.message,
        statusCode
      };
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error.',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR
    };
  }

  private hasMessage(value: unknown): value is { message: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof value.message === 'string'
    );
  }

  private isErrorBody(value: unknown): value is ErrorBody {
    return (
      typeof value === 'object' &&
      value !== null &&
      'code' in value &&
      'message' in value &&
      'statusCode' in value &&
      typeof value.code === 'string' &&
      typeof value.message === 'string' &&
      typeof value.statusCode === 'number'
    );
  }
}

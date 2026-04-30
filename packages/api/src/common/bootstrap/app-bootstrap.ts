import {
  BadRequestException,
  type INestApplication,
  ValidationPipe
} from '@nestjs/common';

import { ApiExceptionFilter } from '../filters/api-exception.filter';
import { ResponseEnvelopeInterceptor } from '../interceptors/response-envelope.interceptor';

export function applyAppSetup(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: () => {
        return new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          statusCode: 400
        });
      }
    })
  );
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
}

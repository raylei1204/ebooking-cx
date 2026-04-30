import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';

interface Envelope<TData> {
  data: TData;
}

@Injectable()
export class ResponseEnvelopeInterceptor<TData> implements NestInterceptor<
  TData,
  Envelope<TData> | TData
> {
  public intercept(
    context: ExecutionContext,
    next: CallHandler<TData>
  ): Observable<Envelope<TData> | TData> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((body) => {
        if (response.statusCode === 204 || this.isEnvelope(body)) {
          return body;
        }

        return {
          data: body
        };
      })
    );
  }

  private isEnvelope(value: unknown): value is Envelope<TData> {
    return typeof value === 'object' && value !== null && 'data' in value;
  }
}

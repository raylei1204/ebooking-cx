import { Injectable } from '@nestjs/common';

interface HealthResponse {
  data: {
    service: string;
    status: string;
  };
}

@Injectable()
export class AppService {
  public getHealth(): HealthResponse {
    return {
      data: {
        service: 'api',
        status: 'ok'
      }
    };
  }
}

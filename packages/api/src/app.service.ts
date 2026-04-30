import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  public getHealth(): { service: string; status: string } {
    return {
      service: 'api',
      status: 'ok'
    };
  }
}

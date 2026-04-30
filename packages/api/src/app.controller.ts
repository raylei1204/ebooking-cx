import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

interface HealthResponse {
  data: {
    service: string;
    status: string;
  };
}

@Controller('api/v1/internal/health')
export class AppController {
  public constructor(private readonly appService: AppService) {}

  @Get()
  public getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}

import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller('api/v1/internal/health')
export class AppController {
  public constructor(private readonly appService: AppService) {}

  @Get()
  public getHealth(): { service: string; status: string } {
    return this.appService.getHealth();
  }
}

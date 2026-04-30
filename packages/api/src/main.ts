import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { applyAppSetup } from './common/bootstrap/app-bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? '3000');

  applyAppSetup(app);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();

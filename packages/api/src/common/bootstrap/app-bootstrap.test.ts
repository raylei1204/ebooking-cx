import {
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Post
} from '@nestjs/common';
import { afterEach, describe, it } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';

import { applyAppSetup } from './app-bootstrap';

class CreateSampleDto {
  @IsString()
  public name!: string;
}

@Controller('api/v1/internal/test-bootstrap')
class TestBootstrapController {
  @Get('success')
  public getSuccess(): { ok: boolean } {
    return { ok: true };
  }

  @Get('error')
  public getError(): never {
    throw new NotFoundException('Missing resource.');
  }

  @Post('validate')
  public create(@Body() body: CreateSampleDto): CreateSampleDto {
    return body;
  }
}

@Module({
  controllers: [TestBootstrapController]
})
class TestBootstrapModule {}

describe('applyAppSetup', () => {
  let moduleFixture: TestingModule;

  afterEach(async () => {
    await moduleFixture?.close();
  });

  it('wraps successful responses in the shared success envelope', async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [TestBootstrapModule]
    }).compile();

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/internal/test-bootstrap/success')
      .expect(200)
      .expect({
        data: {
          ok: true
        }
      });
  });

  it('returns the shared error envelope for framework exceptions', async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [TestBootstrapModule]
    }).compile();

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/internal/test-bootstrap/error')
      .expect(404)
      .expect({
        error: {
          code: 'NOT_FOUND',
          message: 'Missing resource.',
          statusCode: 404
        }
      });
  });

  it('applies global validation and transforms invalid payloads into the shared error envelope', async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [TestBootstrapModule]
    }).compile();

    const app = moduleFixture.createNestApplication();
    applyAppSetup(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/internal/test-bootstrap/validate')
      .send({})
      .expect(400)
      .expect({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          statusCode: 400
        }
      });

    await app.close();
  });
});

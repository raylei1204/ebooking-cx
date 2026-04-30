import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { PrismaModule } from './database/prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true
    }),
    PrismaModule,
    AuthModule,
    BookingsModule,
    OrganizationsModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}

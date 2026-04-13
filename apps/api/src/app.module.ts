import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ServicesCatalogModule } from './services-catalog/services-catalog.module';
import { PatientsModule } from './patients/patients.module';
import { MedRecordsModule } from './med-records/med-records.module';
import { DocumentsModule } from './documents/documents.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StaffManagementModule } from './staff-management/staff-management.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';
import { PromotionsModule } from './promotions/promotions.module';
import { configSchema } from './config/config.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AppointmentsModule,
    ServicesCatalogModule,
    PatientsModule,
    MedRecordsModule,
    DocumentsModule,
    PaymentsModule,
    AnalyticsModule,
    StaffManagementModule,
    NotificationsModule,
    SettingsModule,
    PromotionsModule,
    HealthModule,
  ],
})
export class AppModule {}

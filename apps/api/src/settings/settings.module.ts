import { Module } from '@nestjs/common';
import { SettingsController, AuditLogsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController, AuditLogsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

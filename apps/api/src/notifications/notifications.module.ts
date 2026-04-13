import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { TelegramService } from './telegram.service';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [HttpModule],
  providers: [SmsService, PushService, TelegramService, SchedulerService],
  exports: [SmsService, PushService, TelegramService],
})
export class NotificationsModule {}

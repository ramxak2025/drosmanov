import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const msg = `Ваш код Dr. Osmanov: ${code}. Действует 10 минут. Никому не сообщайте.`;
    await this.sendSms(phone, msg);
  }

  async sendAppointmentReminder(
    phone: string,
    name: string,
    dateStr: string,
    service: string,
    doctorName: string,
  ): Promise<void> {
    const msg = `${name}, напоминаем о записи в клинику Dr. Osmanov. ${dateStr}, услуга: ${service}, врач: ${doctorName}. Ждём вас!`;
    await this.sendSms(phone, msg);
  }

  private async sendSms(phone: string, msg: string): Promise<void> {
    const apiId = this.config.get<string>('SMS_RU_API_ID');

    // In development, just log
    if (this.config.get<string>('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV SMS] to ${phone.slice(0, 4)}***${phone.slice(-4)}: ${msg}`);
      return;
    }

    try {
      const url = new URL('https://sms.ru/sms/send');
      url.searchParams.set('api_id', apiId!);
      url.searchParams.set('to', phone);
      url.searchParams.set('msg', msg);
      url.searchParams.set('json', '1');
      url.searchParams.set('from', 'DrOsmanov');

      const response = await this.httpService.axiosRef.get(url.toString());
      if (response.data?.status !== 'OK') {
        this.logger.error(`SMS failed to ${phone.slice(0, 4)}***${phone.slice(-4)}`);
      }
    } catch (error) {
      this.logger.error(`SMS error: ${(error as Error).message}`);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: { sendMessage: (chatId: string, text: string, options?: Record<string, unknown>) => Promise<void> } | null = null;

  constructor(private config: ConfigService) {
    this.initBot();
  }

  private async initBot() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('Telegram bot token not configured');
      return;
    }

    try {
      const TelegramBot = (await import('node-telegram-bot-api')).default;
      this.bot = new TelegramBot(token, { polling: false });
      this.logger.log('Telegram bot initialized');
    } catch (error) {
      this.logger.error(`Telegram bot init failed: ${(error as Error).message}`);
    }
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn('Telegram bot not initialized');
      return;
    }

    try {
      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error(`Telegram send failed to ${chatId}: ${(error as Error).message}`);
    }
  }

  async notifyStaffNewAppointment(chatId: string, patientName: string, serviceName: string, dateStr: string) {
    const msg = `📋 *Новая запись*\nПациент: ${patientName}\nУслуга: ${serviceName}\nДата: ${dateStr}`;
    await this.sendMessage(chatId, msg);
  }

  async notifyStaffCancellation(chatId: string, patientName: string, serviceName: string, dateStr: string) {
    const msg = `❌ *Отмена записи*\nПациент: ${patientName}\nУслуга: ${serviceName}\nДата: ${dateStr}`;
    await this.sendMessage(chatId, msg);
  }
}

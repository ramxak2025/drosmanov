import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { TelegramService } from './telegram.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
    private pushService: PushService,
    private telegramService: TelegramService,
  ) {}

  // Every day at 10:00 Moscow time — send reminders for tomorrow
  @Cron('0 10 * * *', { timeZone: 'Europe/Moscow' })
  async sendTomorrowReminders(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayEnd = new Date(tomorrow);
    dayEnd.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: { gte: tomorrow, lte: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
        reminderSent: false,
      },
      include: {
        client: { include: { user: true } },
        staff: { include: { user: true } },
        service: true,
      },
    });

    this.logger.log(`Sending reminders for ${appointments.length} appointments`);

    for (const apt of appointments) {
      const timeStr = `${String(apt.startTime.getHours()).padStart(2, '0')}:${String(apt.startTime.getMinutes()).padStart(2, '0')}`;
      const dateStr = `${apt.startTime.toLocaleDateString('ru-RU')} ${timeStr}`;

      try {
        await this.smsService.sendAppointmentReminder(
          apt.client.user.phone,
          apt.client.user.name,
          dateStr,
          apt.service.name,
          apt.staff.user.name,
        );

        await this.pushService.sendToUser(apt.client.userId, {
          title: 'Напоминание о записи',
          body: `Завтра ${timeStr} — ${apt.service.name}`,
          url: '/client/visits',
        });

        await this.prisma.appointment.update({
          where: { id: apt.id },
          data: { reminderSent: true },
        });
      } catch (error) {
        this.logger.error(`Reminder failed for appointment ${apt.id}: ${(error as Error).message}`);
      }
    }
  }

  // Every day at 20:00 Moscow time — send daily report to owner
  @Cron('0 20 * * *', { timeZone: 'Europe/Moscow' })
  async sendDailyOwnerReport(): Promise<void> {
    const settings = await this.prisma.clinicSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings?.ownerTelegramId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [revenue, totalAppointments, completed, cancelled] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { createdAt: { gte: today, lte: todayEnd }, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.appointment.count({
        where: { startTime: { gte: today, lte: todayEnd } },
      }),
      this.prisma.appointment.count({
        where: { startTime: { gte: today, lte: todayEnd }, status: 'COMPLETED' },
      }),
      this.prisma.appointment.count({
        where: { startTime: { gte: today, lte: todayEnd }, status: 'CANCELLED' },
      }),
    ]);

    const dateStr = today.toLocaleDateString('ru-RU');
    const revenueStr = (revenue._sum.amount || 0).toLocaleString('ru-RU');
    const msg = [
      `📊 *Отчёт Dr. Osmanov — ${dateStr}*`,
      `💰 Выручка: *${revenueStr} ₽*`,
      `📅 Записей: ${totalAppointments}`,
      `✅ Завершено: ${completed}`,
      `❌ Отменено: ${cancelled}`,
    ].join('\n');

    await this.telegramService.sendMessage(settings.ownerTelegramId, msg);
  }
}

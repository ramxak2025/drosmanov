import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    try {
      const webpush = await import('web-push');
      webpush.setVapidDetails(
        this.config.get<string>('VAPID_SUBJECT', 'mailto:admin@example.com'),
        this.config.get<string>('VAPID_PUBLIC_KEY', ''),
        this.config.get<string>('VAPID_PRIVATE_KEY', ''),
      );

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          );
        } catch (error) {
          // Remove invalid subscription
          if ((error as { statusCode?: number }).statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          this.logger.error(`Push failed for user ${userId}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Push service error: ${(error as Error).message}`);
    }
  }

  async subscribe(userId: string, endpoint: string, p256dh: string, auth: string, userAgent?: string) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth, userAgent },
      update: { p256dh, auth, userAgent },
    });
  }
}

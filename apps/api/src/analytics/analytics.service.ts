import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(period: string) {
    const { start, end } = this.getPeriodRange(period);

    const [revenue, total, completed, cancelled, newClients] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.appointment.count({
        where: { startTime: { gte: start, lte: end } },
      }),
      this.prisma.appointment.count({
        where: { startTime: { gte: start, lte: end }, status: 'COMPLETED' },
      }),
      this.prisma.appointment.count({
        where: { startTime: { gte: start, lte: end }, status: 'CANCELLED' },
      }),
      this.prisma.client.count({
        where: { user: { createdAt: { gte: start, lte: end } } },
      }),
    ]);

    const totalRevenue = revenue._sum.amount || 0;

    return {
      revenue: totalRevenue,
      appointmentsTotal: total,
      appointmentsCompleted: completed,
      appointmentsCancelled: cancelled,
      newClients,
      averageCheck: completed > 0 ? Math.round(totalRevenue / completed) : 0,
    };
  }

  async getRevenueChart(period: string) {
    const { start, end } = this.getPeriodRange(period);

    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: start, lte: end }, status: 'PAID' },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, number>();
    for (const p of payments) {
      const dateKey = p.createdAt.toISOString().split('T')[0];
      grouped.set(dateKey, (grouped.get(dateKey) || 0) + p.amount);
    }

    return Array.from(grouped.entries()).map(([date, revenue]) => ({ date, revenue }));
  }

  async getTopServices(period: string, limit = 10) {
    const { start, end } = this.getPeriodRange(period);

    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: start, lte: end }, status: 'PAID' },
      include: { appointment: { include: { service: true } } },
    });

    const serviceMap = new Map<string, { count: number; revenue: number }>();
    for (const p of payments) {
      const name = p.appointment.service.name;
      const existing = serviceMap.get(name) || { count: 0, revenue: 0 };
      serviceMap.set(name, {
        count: existing.count + 1,
        revenue: existing.revenue + p.amount,
      });
    }

    return Array.from(serviceMap.entries())
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async exportCsv(startDate: string, endDate: string): Promise<string> {
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        status: 'PAID',
      },
      include: {
        appointment: {
          include: {
            client: { include: { user: true } },
            staff: { include: { user: true } },
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const header = 'Дата,Пациент,Врач,Услуга,Сумма,Метод оплаты,Бонусы использовано,Бонусы начислено';
    const rows = payments.map((p) => {
      const date = p.createdAt.toISOString().split('T')[0];
      const patient = p.appointment.client.user.name;
      const doctor = p.appointment.staff.user.name;
      const service = p.appointment.service.name;
      return `${date},"${patient}","${doctor}","${service}",${p.amount},${p.method},${p.bonusUsed},${p.bonusEarned}`;
    });

    return [header, ...rows].join('\n');
  }

  private getPeriodRange(period: string): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default: // today
        break;
    }

    return { start, end };
  }
}

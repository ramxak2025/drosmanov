import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, user: { sub: string }) {
    const appointment = await this.prisma.appointment.findUniqueOrThrow({
      where: { id: dto.appointmentId },
      include: { client: true, payment: true },
    });

    if (appointment.payment) {
      throw new BadRequestException('Оплата уже существует для этой записи');
    }

    const staff = await this.prisma.staff.findFirst({ where: { userId: user.sub } });

    // Bonus logic
    let bonusUsed = dto.bonusUsed || 0;
    if (bonusUsed > 0) {
      if (bonusUsed > appointment.client.bonusBalance) {
        throw new BadRequestException('Недостаточно бонусов');
      }
    }

    // Get bonus percent from settings
    const settings = await this.prisma.clinicSettings.findUnique({ where: { id: 'singleton' } });
    const bonusPercent = settings?.bonusPercent || 5;
    const bonusEarned = Math.floor((dto.amount - bonusUsed) * bonusPercent / 100);

    // Transaction: create payment + update bonus balance + create bonus transactions
    const payment = await this.prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          appointmentId: dto.appointmentId,
          amount: dto.amount,
          method: dto.method,
          status: 'PAID',
          bonusUsed,
          bonusEarned,
          processedBy: staff?.id || user.sub,
        },
      });

      // Deduct bonus
      if (bonusUsed > 0) {
        await tx.client.update({
          where: { id: appointment.clientId },
          data: { bonusBalance: { decrement: bonusUsed } },
        });
        await tx.bonusTransaction.create({
          data: {
            clientId: appointment.clientId,
            amount: -bonusUsed,
            type: 'SPEND',
            reason: `Оплата приёма ${appointment.id}`,
          },
        });
      }

      // Earn bonus
      if (bonusEarned > 0) {
        await tx.client.update({
          where: { id: appointment.clientId },
          data: { bonusBalance: { increment: bonusEarned } },
        });
        await tx.bonusTransaction.create({
          data: {
            clientId: appointment.clientId,
            amount: bonusEarned,
            type: 'EARN',
            reason: `Начисление за приём ${appointment.id}`,
          },
        });
      }

      return newPayment;
    });

    return payment;
  }

  async getReceipt(id: string) {
    const payment = await this.prisma.payment.findUniqueOrThrow({
      where: { id },
      include: {
        appointment: {
          include: {
            client: { include: { user: true } },
            staff: { include: { user: true } },
            service: true,
          },
        },
      },
    });

    return {
      receiptNumber: payment.receiptNumber,
      date: payment.createdAt,
      patient: payment.appointment.client.user.name,
      service: payment.appointment.service.name,
      doctor: payment.appointment.staff.user.name,
      amount: payment.amount,
      method: payment.method,
      bonusUsed: payment.bonusUsed,
      bonusEarned: payment.bonusEarned,
    };
  }
}

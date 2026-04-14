import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: { sub: string; role: string }, query: {
    status?: string;
    startDate?: string;
    endDate?: string;
    staffId?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = query;
    const where: Record<string, unknown> = {};

    if (user.role === 'CLIENT') {
      const client = await this.prisma.client.findFirst({ where: { userId: user.sub } });
      if (!client) throw new ForbiddenException();
      where.clientId = client.id;
    } else if (user.role === 'STAFF') {
      const staff = await this.prisma.staff.findFirst({ where: { userId: user.sub } });
      if (!staff) throw new ForbiddenException();
      where.staffId = staff.id;
    }

    if (query.status) where.status = query.status;
    if (query.staffId && user.role === 'OWNER') where.staffId = query.staffId;
    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) (where.startTime as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.startTime as Record<string, unknown>).lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          client: { include: { user: true } },
          staff: { include: { user: true } },
          service: true,
          payment: true,
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, user: { sub: string; role: string }) {
    const appointment = await this.prisma.appointment.findUniqueOrThrow({
      where: { id },
      include: {
        client: { include: { user: true } },
        staff: { include: { user: true } },
        service: true,
        payment: true,
      },
    });

    // IDOR check
    if (user.role === 'CLIENT' && appointment.client.userId !== user.sub) {
      throw new ForbiddenException();
    }
    if (user.role === 'STAFF') {
      const staff = await this.prisma.staff.findFirst({ where: { userId: user.sub } });
      if (!staff || appointment.staffId !== staff.id) throw new ForbiddenException();
    }

    return appointment;
  }

  async create(dto: CreateAppointmentDto & { clientId?: string }, user: { sub: string; role: string }) {
    // STAFF и OWNER могут записать любого клиента по clientId из body
    // CLIENT может записать только себя
    let clientId: string;
    if (user.role === 'CLIENT') {
      const client = await this.prisma.client.findFirst({ where: { userId: user.sub } });
      if (!client) throw new ForbiddenException();
      clientId = client.id;
    } else if ((user.role === 'STAFF' || user.role === 'OWNER') && dto.clientId) {
      clientId = dto.clientId;
    } else {
      throw new BadRequestException('Укажите clientId для записи');
    }

    // Check for time conflicts
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        staffId: dto.staffId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            startTime: { lt: new Date(dto.endTime) },
            endTime: { gt: new Date(dto.startTime) },
          },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('Выбранное время уже занято');
    }

    return this.prisma.appointment.create({
      data: {
        clientId,
        staffId: dto.staffId,
        serviceId: dto.serviceId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        notes: dto.notes,
      },
      include: {
        client: { include: { user: true } },
        staff: { include: { user: true } },
        service: true,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateStatusDto, user: { sub: string; role: string }) {
    const appointment = await this.prisma.appointment.findUniqueOrThrow({ where: { id } });

    // Only STAFF and OWNER can change status
    if (user.role === 'CLIENT') throw new ForbiddenException();

    const allowed = VALID_TRANSITIONS[appointment.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Нельзя перевести запись из статуса ${appointment.status} в ${dto.status}`,
      );
    }

    if (dto.status === 'CANCELLED' && !dto.cancelReason) {
      throw new BadRequestException('Укажите причину отмены');
    }

    // Бонусная система будет запущена позже

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        cancelReason: dto.cancelReason,
        cancelledAt: dto.status === 'CANCELLED' ? new Date() : undefined,
      },
      include: {
        client: { include: { user: true } },
        staff: { include: { user: true } },
        service: true,
      },
    });
  }

  async cancel(id: string, user: { sub: string }) {
    const appointment = await this.prisma.appointment.findUniqueOrThrow({
      where: { id },
      include: { client: true },
    });

    if (appointment.client.userId !== user.sub) {
      throw new ForbiddenException();
    }

    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw new BadRequestException('Нельзя отменить запись в текущем статусе');
    }

    const hoursUntil = (appointment.startTime.getTime() - Date.now()) / 3600_000;
    if (hoursUntil < 24) {
      throw new BadRequestException('Отмена возможна не позднее чем за 24 часа до приёма');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: 'Отменено пациентом',
        cancelledAt: new Date(),
      },
    });
  }

  async getAvailableSlots(staffId: string, date: string, serviceId: string) {
    const staff = await this.prisma.staff.findUniqueOrThrow({ where: { id: staffId } });
    const service = await this.prisma.service.findUniqueOrThrow({ where: { id: serviceId } });

    const targetDate = new Date(date);
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = days[targetDate.getDay()];

    const schedule = staff.workSchedule as Record<string, { start: string; end: string } | null> | null;
    if (!schedule || !schedule[dayKey]) return [];

    const daySchedule = schedule[dayKey]!;

    // Get existing appointments for that day
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await this.prisma.appointment.findMany({
      where: {
        staffId,
        startTime: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { startTime: true, endTime: true },
    });

    const existingSlots = existing.map((a) => ({
      start: `${String(a.startTime.getHours()).padStart(2, '0')}:${String(a.startTime.getMinutes()).padStart(2, '0')}`,
      end: `${String(a.endTime.getHours()).padStart(2, '0')}:${String(a.endTime.getMinutes()).padStart(2, '0')}`,
    }));

    // Generate slots using shared utility logic
    const slots = this.generateSlots(daySchedule, service.duration, existingSlots);
    return slots;
  }

  private generateSlots(
    daySchedule: { start: string; end: string },
    duration: number,
    existing: { start: string; end: string }[],
  ) {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const toTime = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    const startMin = toMin(daySchedule.start);
    const endMin = toMin(daySchedule.end);
    const slots: { start: string; end: string }[] = [];

    for (let cur = startMin; cur + duration <= endMin; cur += 30) {
      const hasConflict = existing.some((e) => {
        const eStart = toMin(e.start);
        const eEnd = toMin(e.end);
        return cur < eEnd && cur + duration > eStart;
      });

      if (!hasConflict) {
        slots.push({ start: toTime(cur), end: toTime(cur + duration) });
      }
    }

    return slots;
  }
}

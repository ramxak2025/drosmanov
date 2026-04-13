import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page = 1, limit = 20) {
    const where = search
      ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          },
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: { user: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { user: { name: 'asc' } },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, user: { sub: string; role: string }) {
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id },
      include: {
        user: true,
        appointments: {
          include: { service: true, staff: { include: { user: true } } },
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        medHistory: {
          include: { staff: { include: { user: true } }, documents: true },
          orderBy: { date: 'desc' },
        },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (user.role === 'CLIENT' && client.userId !== user.sub) {
      throw new ForbiddenException();
    }

    return client;
  }

  async update(id: string, dto: UpdatePatientDto, user: { sub: string; role: string }) {
    const client = await this.prisma.client.findUniqueOrThrow({ where: { id } });

    if (user.role === 'CLIENT' && client.userId !== user.sub) {
      throw new ForbiddenException();
    }

    const updateData: Record<string, unknown> = {};
    if (dto.birthDate) updateData.birthDate = new Date(dto.birthDate);
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.allergyNotes !== undefined) updateData.allergyNotes = dto.allergyNotes;

    const result = await this.prisma.client.update({
      where: { id },
      data: updateData,
      include: { user: true },
    });

    if (dto.name) {
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { name: dto.name },
      });
    }

    return result;
  }
}

import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedRecordDto } from './dto/create-med-record.dto';
import { UpdateMedRecordDto } from './dto/update-med-record.dto';

@Injectable()
export class MedRecordsService {
  constructor(private prisma: PrismaService) {}

  async findByClient(clientId: string, user: { sub: string; role: string }) {
    if (user.role === 'CLIENT') {
      const client = await this.prisma.client.findFirst({ where: { id: clientId, userId: user.sub } });
      if (!client) throw new ForbiddenException();
    }

    return this.prisma.medRecord.findMany({
      where: { clientId },
      include: {
        staff: { include: { user: true } },
        documents: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(dto: CreateMedRecordDto, user: { sub: string; role: string }) {
    if (user.role === 'CLIENT') throw new ForbiddenException();

    const staff = await this.prisma.staff.findFirst({ where: { userId: user.sub } });
    if (!staff) throw new ForbiddenException();

    return this.prisma.medRecord.create({
      data: {
        clientId: dto.clientId,
        staffId: staff.id,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        teethMap: dto.teethMap || undefined,
        notes: dto.notes,
      },
      include: {
        staff: { include: { user: true } },
        documents: true,
      },
    });
  }

  async update(id: string, dto: UpdateMedRecordDto, user: { sub: string; role: string }) {
    const record = await this.prisma.medRecord.findUniqueOrThrow({ where: { id } });

    if (user.role === 'STAFF') {
      const staff = await this.prisma.staff.findFirst({ where: { userId: user.sub } });
      if (!staff || record.staffId !== staff.id) throw new ForbiddenException();
    } else if (user.role === 'CLIENT') {
      throw new ForbiddenException();
    }

    return this.prisma.medRecord.update({
      where: { id },
      data: dto,
      include: {
        staff: { include: { user: true } },
        documents: true,
      },
    });
  }
}

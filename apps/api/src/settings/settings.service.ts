import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    return this.prisma.clinicSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
  }

  async update(dto: UpdateSettingsDto) {
    return this.prisma.clinicSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...dto },
      update: dto,
    });
  }

  async uploadHero(file: Express.Multer.File) {
    const photosDir = join(UPLOAD_DIR, 'settings');
    await mkdir(photosDir, { recursive: true });

    let storedName: string;
    try {
      const sharp = (await import('sharp')).default;
      storedName = `${randomUUID()}.webp`;
      await sharp(file.buffer)
        .resize(1600, 900, { fit: 'cover' })
        .webp({ quality: 82 })
        .toFile(join(photosDir, storedName));
    } catch (_e) {
      storedName = `${randomUUID()}.jpg`;
      await writeFile(join(photosDir, storedName), file.buffer);
    }

    const heroImagePath = `settings/${storedName}`;
    await this.prisma.clinicSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', heroImagePath },
      update: { heroImagePath },
    });

    return { heroImagePath };
  }

  async getAuditLogs(query: {
    userId?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50 } = query;
    const where: Record<string, unknown> = {};

    if (query.userId) where.userId = query.userId;
    if (query.entity) where.entity = query.entity;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

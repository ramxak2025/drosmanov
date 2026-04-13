import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', '/app/uploads');
  }

  async findAll(activeOnly = true) {
    const where = activeOnly
      ? { isActive: true, endDate: { gte: new Date() } }
      : {};

    return this.prisma.promotion.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.promotion.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreatePromotionDto, user: { sub: string; role: string }) {
    await this.checkPermission(user);
    return this.prisma.promotion.create({
      data: {
        title: dto.title,
        description: dto.description,
        discount: dto.discount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async update(id: string, dto: UpdatePromotionDto, user: { sub: string; role: string }) {
    await this.checkPermission(user);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.discount !== undefined) data.discount = dto.discount;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.promotion.update({ where: { id }, data });
  }

  async uploadPhoto(id: string, file: Express.Multer.File, user: { sub: string; role: string }) {
    await this.checkPermission(user);

    const photosDir = join(this.uploadDir, 'promotions');
    if (!existsSync(photosDir)) {
      await mkdir(photosDir, { recursive: true });
    }

    let storedName: string;
    try {
      const sharp = (await import('sharp')).default;
      storedName = `${randomUUID()}.webp`;
      await sharp(file.buffer)
        .resize(1200, 600, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(join(photosDir, storedName));
    } catch {
      storedName = `${randomUUID()}.jpg`;
      await writeFile(join(photosDir, storedName), file.buffer);
    }

    return this.prisma.promotion.update({
      where: { id },
      data: { photoPath: `promotions/${storedName}` },
    });
  }

  async deactivate(id: string, user: { sub: string; role: string }) {
    await this.checkPermission(user);
    return this.prisma.promotion.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async checkPermission(user: { sub: string; role: string }) {
    if (user.role === 'OWNER') return;
    if (user.role === 'STAFF') {
      const staff = await this.prisma.staff.findFirst({ where: { userId: user.sub } });
      if (!staff?.canManagePromotions) {
        throw new ForbiddenException('У вас нет прав на управление акциями');
      }
    }
  }
}

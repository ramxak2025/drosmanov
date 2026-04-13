import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesCatalogService {
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', '/app/uploads');
  }

  async findAll(category?: string, isActive?: boolean) {
    return this.prisma.service.findMany({
      where: {
        ...(category && { category }),
        isActive: isActive ?? true,
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreateServiceDto, user: { sub: string; role: string }) {
    await this.checkPermission(user);
    return this.prisma.service.create({ data: dto });
  }

  async update(id: string, dto: UpdateServiceDto, user: { sub: string; role: string }) {
    await this.checkPermission(user);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async uploadPhoto(id: string, file: Express.Multer.File, user: { sub: string; role: string }) {
    await this.checkPermission(user);

    const photosDir = join(this.uploadDir, 'services');
    if (!existsSync(photosDir)) {
      await mkdir(photosDir, { recursive: true });
    }

    // Process through Sharp
    let storedName: string;
    try {
      const sharp = (await import('sharp')).default;
      storedName = `${randomUUID()}.webp`;
      await sharp(file.buffer)
        .resize(800, 600, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(join(photosDir, storedName));
    } catch {
      storedName = `${randomUUID()}.jpg`;
      await writeFile(join(photosDir, storedName), file.buffer);
    }

    const photoPath = `services/${storedName}`;

    return this.prisma.service.update({
      where: { id },
      data: { photoPath },
    });
  }

  async deactivate(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async checkPermission(user: { sub: string; role: string }) {
    if (user.role === 'OWNER') return;

    if (user.role === 'STAFF') {
      const staff = await this.prisma.staff.findFirst({ where: { userId: user.sub } });
      if (!staff?.canManageServices) {
        throw new ForbiddenException('У вас нет прав на управление услугами');
      }
    }
  }
}

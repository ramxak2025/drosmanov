import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { hashValue } from '../common/utils/crypto.util';

@Injectable()
export class StaffManagementService {
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', '/app/uploads');
  }

  async findAll(serviceId?: string) {
    // Если указан serviceId — возвращаем только тех кто оказывает эту услугу
    return this.prisma.staff.findMany({
      where: serviceId
        ? { isActive: true, services: { some: { serviceId } } }
        : undefined,
      include: {
        user: true,
        services: { select: { serviceId: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });
  }

  async findOne(id: string) {
    return this.prisma.staff.findUniqueOrThrow({
      where: { id },
      include: {
        user: true,
        services: { select: { serviceId: true } },
      },
    });
  }

  async create(dto: CreateStaffDto) {
    const passwordHash = await hashValue(dto.password);

    return this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        name: dto.name,
        role: 'STAFF',
        staffProfile: {
          create: {
            specialty: dto.specialty,
            bio: dto.bio,
            salary: dto.salary || 0,
            workSchedule: dto.workSchedule ? (dto.workSchedule as Prisma.InputJsonValue) : Prisma.JsonNull,
            canManageServices: dto.canManageServices || false,
            canManageSchedule: dto.canManageSchedule || false,
            canManagePromotions: dto.canManagePromotions || false,
          },
        },
      },
      include: { staffProfile: true },
    });
  }

  async update(id: string, dto: UpdateStaffDto) {
    const staff = await this.prisma.staff.findUniqueOrThrow({ where: { id } });

    const staffData: Record<string, unknown> = {};
    if (dto.specialty !== undefined) staffData.specialty = dto.specialty;
    if (dto.bio !== undefined) staffData.bio = dto.bio;
    if (dto.salary !== undefined) staffData.salary = dto.salary;
    if (dto.workSchedule !== undefined) staffData.workSchedule = dto.workSchedule;
    if (dto.canManageServices !== undefined) staffData.canManageServices = dto.canManageServices;
    if (dto.canManageSchedule !== undefined) staffData.canManageSchedule = dto.canManageSchedule;
    if (dto.canManagePromotions !== undefined) staffData.canManagePromotions = dto.canManagePromotions;

    if (dto.name) {
      await this.prisma.user.update({
        where: { id: staff.userId },
        data: { name: dto.name },
      });
    }

    // Обновление списка услуг — заменяем полностью
    if (Array.isArray(dto.serviceIds)) {
      await this.prisma.staffService.deleteMany({ where: { staffId: id } });
      if (dto.serviceIds.length > 0) {
        await this.prisma.staffService.createMany({
          data: dto.serviceIds.map((serviceId) => ({ staffId: id, serviceId })),
        });
      }
    }

    return this.prisma.staff.update({
      where: { id },
      data: staffData,
      include: { user: true },
    });
  }

  async uploadPhoto(id: string, file: Express.Multer.File) {
    const photosDir = join(this.uploadDir, 'staff');
    if (!existsSync(photosDir)) await mkdir(photosDir, { recursive: true });

    let storedName: string;
    try {
      const sharp = (await import('sharp')).default;
      storedName = `${randomUUID()}.webp`;
      // Портретное фото врача — соотношение 3:4
      await sharp(file.buffer)
        .resize(600, 800, { fit: 'cover', position: 'top' })
        .webp({ quality: 85 })
        .toFile(join(photosDir, storedName));
    } catch {
      storedName = `${randomUUID()}.jpg`;
      await writeFile(join(photosDir, storedName), file.buffer);
    }

    return this.prisma.staff.update({
      where: { id },
      data: { photoPath: `staff/${storedName}` },
      include: { user: true },
    });
  }

  async deactivate(id: string) {
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: false },
      include: { user: true },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { hashValue } from '../common/utils/crypto.util';

@Injectable()
export class StaffManagementService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.staff.findMany({
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
    });
  }

  async findOne(id: string) {
    return this.prisma.staff.findUniqueOrThrow({
      where: { id },
      include: { user: true },
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

    return this.prisma.staff.update({
      where: { id },
      data: staffData,
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

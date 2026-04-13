import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

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
    return this.prisma.user.create({
      data: {
        phone: dto.phone,
        name: dto.name,
        role: 'STAFF',
        staffProfile: {
          create: {
            specialty: dto.specialty,
            bio: dto.bio,
            salary: dto.salary || 0,
            workSchedule: dto.workSchedule || null,
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

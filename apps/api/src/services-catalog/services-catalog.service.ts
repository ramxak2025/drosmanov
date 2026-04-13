import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesCatalogService {
  constructor(private prisma: PrismaService) {}

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

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  async update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

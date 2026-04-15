import {
  Controller, Get, Post, Patch, Delete, Query,
  Body, Param, ParseUUIDPipe,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StaffManagementService } from './staff-management.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('staff')
export class StaffManagementController {
  constructor(private service: StaffManagementService) {}

  @Public()
  @Get()
  findAll(@Query('serviceId') serviceId?: string) {
    return this.service.findAll(serviceId);
  }

  @Get(':id')
  @Roles('STAFF', 'OWNER')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(id); }

  @Post()
  @Roles('OWNER')
  create(@Body() dto: CreateStaffDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles('OWNER')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/photo')
  @Roles('OWNER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED.includes(file.mimetype)) return cb(new BadRequestException('Только изображения'), false);
        cb(null, true);
      },
    }),
  )
  uploadPhoto(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не загружен');
    return this.service.uploadPhoto(id, file);
  }

  @Delete(':id')
  @Roles('OWNER')
  deactivate(@Param('id', ParseUUIDPipe) id: string) { return this.service.deactivate(id); }
}

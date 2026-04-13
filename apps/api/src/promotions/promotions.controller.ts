import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('promotions')
export class PromotionsController {
  constructor(private service: PromotionsService) {}

  @Public()
  @Get()
  findAll(@Query('all') all?: string) {
    return this.service.findAll(all !== 'true');
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  create(
    @Body() dto: CreatePromotionDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles('OWNER', 'STAFF')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/photo')
  @Roles('OWNER', 'STAFF')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          return cb(new BadRequestException('Только изображения'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    if (!file) throw new BadRequestException('Файл не загружен');
    return this.service.uploadPhoto(id, file, user);
  }

  @Delete(':id')
  @Roles('OWNER', 'STAFF')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.deactivate(id, user);
  }
}

import {
  Controller, Post, Get, Param, Req, Res,
  UseInterceptors, UploadedFile, BadRequestException,
  ParseUUIDPipe, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@Controller('documents')
export class DocumentsController {
  constructor(private service: DocumentsService) {}

  @Post('upload')
  @Roles('STAFF', 'OWNER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          return cb(new BadRequestException('Недопустимый тип файла'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('clientId') clientId?: string,
    @Query('medRecordId') medRecordId?: string,
    @Query('type') type?: string,
    @CurrentUser() user?: { sub: string },
  ) {
    if (!file) throw new BadRequestException('Файл не загружен');
    return this.service.upload(file, clientId, medRecordId, type || 'OTHER', user!);
  }

  @Get(':id/download')
  @Roles('CLIENT', 'STAFF', 'OWNER')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub: string; role: string },
    @Res() res: Response,
  ) {
    const doc = await this.service.findOne(id, user);
    const filePath = this.service.getFilePath(doc.storedName);

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalName)}"`);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    createReadStream(filePath).pipe(res);
  }
}

import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHash } from 'crypto';
import { join, resolve } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@Injectable()
export class DocumentsService {
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', '/app/uploads');
  }

  async upload(
    file: Express.Multer.File,
    clientId: string | undefined,
    medRecordId: string | undefined,
    type: string,
    user: { sub: string },
  ) {
    // Validate MIME by magic bytes
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIMES.includes(detected.mime)) {
      throw new BadRequestException('Файл не прошёл проверку содержимого');
    }

    const staff = await this.prisma.staff.findFirst({ where: { userId: user.sub } });

    // Generate UUID filename
    let storedName = `${randomUUID()}.${detected.ext}`;
    let processedBuffer = file.buffer;

    // Process images through Sharp
    if (detected.mime.startsWith('image/')) {
      const sharp = (await import('sharp')).default;
      processedBuffer = await sharp(file.buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      storedName = `${randomUUID()}.webp`;
    }

    // Ensure upload directory exists
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }

    const uploadPath = join(this.uploadDir, storedName);
    await writeFile(uploadPath, processedBuffer);

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    return this.prisma.document.create({
      data: {
        clientId,
        staffId: staff?.id,
        medRecordId,
        type: type as 'XRAY' | 'PHOTO' | 'CONTRACT' | 'OTHER',
        originalName: file.originalname,
        storedName,
        mimeType: detected.mime,
        size: processedBuffer.length,
        checksum,
      },
    });
  }

  async findOne(id: string, user: { sub: string; role: string }) {
    const doc = await this.prisma.document.findUniqueOrThrow({
      where: { id },
      include: { client: true },
    });

    // IDOR check
    if (user.role === 'CLIENT') {
      if (!doc.client || doc.client.userId !== user.sub) {
        throw new ForbiddenException();
      }
    }

    return doc;
  }

  getFilePath(storedName: string): string {
    const filePath = join(this.uploadDir, storedName);
    const resolvedPath = resolve(filePath);
    const resolvedUploadDir = resolve(this.uploadDir);

    // Path traversal prevention
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new ForbiddenException();
    }

    return resolvedPath;
  }
}

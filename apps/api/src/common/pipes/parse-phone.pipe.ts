import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const PHONE_REGEX = /^\+7\d{10}$/;

@Injectable()
export class ParsePhonePipe implements PipeTransform {
  transform(value: string): string {
    const normalized = this.normalize(value);
    if (!PHONE_REGEX.test(normalized)) {
      throw new BadRequestException('Неверный формат телефона. Используйте +7XXXXXXXXXX');
    }
    return normalized;
  }

  private normalize(phone: string): string {
    let cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('8') && cleaned.length === 11) {
      cleaned = '+7' + cleaned.slice(1);
    }
    if (cleaned.startsWith('7') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  }
}

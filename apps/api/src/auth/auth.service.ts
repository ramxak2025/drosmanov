import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { hashValue, compareHash } from '../common/utils/crypto.util';
import { maskIp } from '../common/utils/mask.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async sendOtp(phone: string, ip: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);

    // Rate limit: max 3 OTPs per phone per hour
    const recentOtps = await this.prisma.otpCode.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: new Date(Date.now() - 3600_000) },
      },
    });
    if (recentOtps >= 3) {
      throw new HttpException(
        'Превышен лимит OTP. Попробуйте через час.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const codeHash = await hashValue(code);

    await this.prisma.otpCode.create({
      data: {
        phone: normalizedPhone,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60_000),
        ipAddress: maskIp(ip),
      },
    });

    await this.smsService.sendOtp(normalizedPhone, code);
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    const normalizedPhone = this.normalizePhone(phone);

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Код недействителен или истёк');
    }

    if (otpRecord.attempts >= 3) {
      throw new UnauthorizedException('Превышено количество попыток');
    }

    // Increment attempts BEFORE checking (timing attack prevention)
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    const isValid = await compareHash(code, otpRecord.codeHash);
    if (!isValid) {
      throw new UnauthorizedException('Неверный код');
    }

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    let user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: name || '',
          role: 'CLIENT',
          clientProfile: { create: {} },
        },
        include: { clientProfile: true },
      });
    }

    return this.issueTokens(user);
  }

  async refresh(refreshTokenRaw: string) {
    if (!refreshTokenRaw) {
      throw new UnauthorizedException('Refresh token отсутствует');
    }

    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedToken = null;
    for (const token of tokens) {
      const isMatch = await compareHash(refreshTokenRaw, token.tokenHash);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { isRevoked: true },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: matchedToken.userId },
    });

    return this.issueTokens(user);
  }

  async logout(refreshTokenRaw: string): Promise<void> {
    if (!refreshTokenRaw) return;

    const tokens = await this.prisma.refreshToken.findMany({
      where: { isRevoked: false },
    });

    for (const token of tokens) {
      const isMatch = await compareHash(refreshTokenRaw, token.tokenHash);
      if (isMatch) {
        await this.prisma.refreshToken.update({
          where: { id: token.id },
          data: { isRevoked: true },
        });
        break;
      }
    }
  }

  private async issueTokens(user: { id: string; role: string; name: string; phone: string }) {
    const jti = randomUUID();
    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: user.role,
      jti,
    });

    const refreshTokenRaw = randomBytes(64).toString('hex');
    const refreshTokenHash = await hashValue(refreshTokenRaw);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('8') && cleaned.length === 11) {
      cleaned = '+7' + cleaned.slice(1);
    }
    if (cleaned.startsWith('7') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    }
    if (!/^\+7\d{10}$/.test(cleaned)) {
      throw new UnauthorizedException('Неверный формат телефона');
    }
    return cleaned;
  }
}

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { hashValue, compareHash } from '../common/utils/crypto.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(phone: string, password: string) {
    const normalizedPhone = this.normalizePhone(phone);

    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Неверный телефон или пароль');
    }

    const isValid = await compareHash(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Неверный телефон или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    return this.issueTokens(user);
  }

  async register(phone: string, password: string, name?: string) {
    const normalizedPhone = this.normalizePhone(phone);

    const existing = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existing) {
      throw new ConflictException('Пользователь с таким номером уже существует');
    }

    const passwordHash = await hashValue(password);

    const user = await this.prisma.user.create({
      data: {
        phone: normalizedPhone,
        passwordHash,
        name: name || '',
        role: 'CLIENT',
        clientProfile: { create: {} },
      },
    });

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

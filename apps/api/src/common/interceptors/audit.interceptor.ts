import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { maskIp } from '../utils/mask.util';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (!['POST', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = req.user;
    if (!user) return next.handle();

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const sanitized = method !== 'DELETE' ? this.sanitize(req.body) : undefined;

          await this.prisma.auditLog.create({
            data: {
              userId: user.sub,
              action: `${method} ${req.route?.path || req.url}`,
              entity: this.extractEntity(req.route?.path || req.url),
              entityId: (response as Record<string, unknown>)?.id as string || req.params?.id,
              newValue: sanitized ? (sanitized as Prisma.InputJsonValue) : Prisma.JsonNull,
              ipAddress: maskIp(req.ip),
              userAgent: req.headers['user-agent']?.slice(0, 200),
            },
          });
        } catch {
          // Аудит не должен ломать основной запрос
        }
      }),
    );
  }

  private extractEntity(path: string): string {
    const parts = path.replace('/api/', '').split('/');
    return parts[0] || 'unknown';
  }

  private sanitize(body: Record<string, unknown>): Record<string, Prisma.InputJsonValue> | undefined {
    if (!body) return undefined;
    const { password, code, token, codeHash, tokenHash, ...safe } = body;
    return safe as Record<string, Prisma.InputJsonValue>;
  }
}

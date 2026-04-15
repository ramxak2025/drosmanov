import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

// BUILD-ID: меняется при каждом деплое для проверки что новая версия в air
const BUILD_ID = '2026-04-15-desktop-responsive-v6';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      buildId: BUILD_ID,
    };
  }
}

import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get()
  @Roles('OWNER')
  get() {
    return this.service.get();
  }

  @Patch()
  @Roles('OWNER')
  update(@Body() dto: UpdateSettingsDto) {
    return this.service.update(dto);
  }
}

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private service: SettingsService) {}

  @Get()
  @Roles('OWNER')
  findAll(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAuditLogs({
      userId,
      entity,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}

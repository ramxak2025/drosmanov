import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('overview')
  @Roles('OWNER')
  getOverview(@Query('period') period: string = 'today') {
    return this.service.getOverview(period);
  }

  @Get('revenue-chart')
  @Roles('OWNER')
  getRevenueChart(@Query('period') period: string = 'month') {
    return this.service.getRevenueChart(period);
  }

  @Get('top-services')
  @Roles('OWNER')
  getTopServices(
    @Query('period') period: string = 'month',
    @Query('limit') limit?: string,
  ) {
    return this.service.getTopServices(period, limit ? parseInt(limit, 10) : 10);
  }

  @Get('export')
  @Roles('OWNER')
  async exportCsv(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportCsv(startDate, endDate);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="osmanov-finance.csv"`);
    // BOM for Excel to read UTF-8 correctly
    res.send('\uFEFF' + csv);
  }
}

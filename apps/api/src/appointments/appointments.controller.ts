import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Get()
  @Roles('CLIENT', 'STAFF', 'OWNER')
  findAll(
    @CurrentUser() user: { sub: string; role: string },
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('staffId') staffId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(user, {
      status,
      startDate,
      endDate,
      staffId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('slots')
  @Public()
  getSlots(
    @Query('staffId') staffId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.service.getAvailableSlots(staffId, date, serviceId);
  }

  @Get(':id')
  @Roles('CLIENT', 'STAFF', 'OWNER')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles('CLIENT')
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.create(dto, user);
  }

  @Patch(':id/status')
  @Roles('STAFF', 'OWNER')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @Roles('CLIENT')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.cancel(id, user);
  }
}

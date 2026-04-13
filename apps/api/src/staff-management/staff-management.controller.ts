import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe,
} from '@nestjs/common';
import { StaffManagementService } from './staff-management.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('staff')
export class StaffManagementController {
  constructor(private service: StaffManagementService) {}

  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('STAFF', 'OWNER')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('OWNER')
  create(@Body() dto: CreateStaffDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('OWNER')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }
}

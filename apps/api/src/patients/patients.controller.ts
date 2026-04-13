import { Controller, Get, Patch, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('patients')
export class PatientsController {
  constructor(private service: PatientsService) {}

  @Get()
  @Roles('STAFF', 'OWNER')
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      search,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(':id')
  @Roles('CLIENT', 'STAFF', 'OWNER')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Roles('CLIENT', 'STAFF', 'OWNER')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.update(id, dto, user);
  }
}

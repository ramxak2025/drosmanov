import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { MedRecordsService } from './med-records.service';
import { CreateMedRecordDto } from './dto/create-med-record.dto';
import { UpdateMedRecordDto } from './dto/update-med-record.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('med-records')
export class MedRecordsController {
  constructor(private service: MedRecordsService) {}

  @Get()
  @Roles('CLIENT', 'STAFF', 'OWNER')
  findByClient(
    @Query('clientId', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.findByClient(clientId, user);
  }

  @Post()
  @Roles('STAFF', 'OWNER')
  create(
    @Body() dto: CreateMedRecordDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles('STAFF', 'OWNER')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedRecordDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.service.update(id, dto, user);
  }
}

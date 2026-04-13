import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
} from '@nestjs/common';
import { ServicesCatalogService } from './services-catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('services')
export class ServicesCatalogController {
  constructor(private service: ServicesCatalogService) {}

  @Public()
  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll(category, isActive === 'false' ? false : true);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('OWNER')
  create(@Body() dto: CreateServiceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('OWNER')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }
}

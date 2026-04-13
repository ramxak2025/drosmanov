import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post()
  @Roles('STAFF', 'OWNER')
  create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.create(dto, user);
  }

  @Get('receipt/:id')
  @Roles('STAFF', 'OWNER')
  getReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getReceipt(id);
  }
}

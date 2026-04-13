import { IsUUID, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BONUS = 'BONUS',
  MIXED = 'MIXED',
}

export class CreatePaymentDto {
  @IsUUID()
  appointmentId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusUsed?: number;
}

import { IsString, IsOptional, IsNumber, IsObject, IsBoolean, MaxLength, Min } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsObject()
  workSchedule?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  canManageServices?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageSchedule?: boolean;

  @IsOptional()
  @IsBoolean()
  canManagePromotions?: boolean;

  // Список ID услуг, которые оказывает этот врач
  @IsOptional()
  serviceIds?: string[];
}

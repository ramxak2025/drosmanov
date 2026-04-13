import { IsString, IsOptional, IsNumber, IsObject, IsBoolean, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @Matches(/^\+7\d{10}$/, { message: 'Телефон должен быть в формате +7XXXXXXXXXX' })
  phone: string;

  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(100)
  specialty: string;

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
  workSchedule?: Record<string, { start: string; end: string } | null>;

  @IsOptional()
  @IsBoolean()
  canManageServices?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageSchedule?: boolean;

  @IsOptional()
  @IsBoolean()
  canManagePromotions?: boolean;
}

import { IsString, IsOptional, IsNumber, IsObject, Matches, MaxLength, Min } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @Matches(/^\+7\d{10}$/, { message: 'Телефон должен быть в формате +7XXXXXXXXXX' })
  phone: string;

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
}

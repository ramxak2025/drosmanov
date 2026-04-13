import { IsString, IsOptional, IsNumber, IsEmail, Min, Max, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bonusPercent?: number;

  @IsOptional()
  @IsString()
  ownerTelegramId?: string;
}

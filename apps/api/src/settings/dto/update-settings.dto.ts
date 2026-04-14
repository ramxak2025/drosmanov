import { IsString, IsOptional, IsNumber, IsEmail, Min, Max, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MaxLength(200)  name?: string;
  @IsOptional() @IsString() @MaxLength(500)  address?: string;
  @IsOptional() @IsString() @MaxLength(30)   phone?: string;
  @IsOptional() @IsEmail()                    email?: string;
  @IsOptional() @IsString() @MaxLength(200)  workHours?: string;
  @IsOptional() @IsNumber()                   mapLat?: number;
  @IsOptional() @IsNumber()                   mapLng?: number;

  @IsOptional() @IsString() @MaxLength(300)  whatsapp?: string;
  @IsOptional() @IsString() @MaxLength(300)  telegram?: string;
  @IsOptional() @IsString() @MaxLength(300)  vk?: string;
  @IsOptional() @IsString() @MaxLength(300)  youtube?: string;
  @IsOptional() @IsString() @MaxLength(300)  instagram?: string;
  @IsOptional() @IsString() @MaxLength(300)  facebook?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100) bonusPercent?: number;
  @IsOptional() @IsString()                    ownerTelegramId?: string;
}

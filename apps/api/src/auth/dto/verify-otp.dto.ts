import { IsString, Matches, IsOptional, MaxLength } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+7\d{10}$/, { message: 'Телефон должен быть в формате +7XXXXXXXXXX' })
  phone: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'Код должен состоять из 4 цифр' })
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^\+7\d{10}$/, { message: 'Телефон должен быть в формате +7XXXXXXXXXX' })
  phone: string;

  @IsString()
  @MinLength(4, { message: 'Пароль минимум 4 символа' })
  @MaxLength(100)
  password: string;
}

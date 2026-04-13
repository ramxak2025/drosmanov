import { IsString, IsNumber, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(15)
  duration: number;

  @IsString()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

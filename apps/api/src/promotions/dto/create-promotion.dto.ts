import { IsString, IsOptional, IsNumber, IsDateString, MaxLength, Min, Max } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

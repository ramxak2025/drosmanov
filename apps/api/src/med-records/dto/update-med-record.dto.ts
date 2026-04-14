import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';

export class UpdateMedRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  treatment?: string;

  @IsOptional()
  @IsObject()
  teethMap?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

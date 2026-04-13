import { IsString, IsUUID, IsOptional, MaxLength, IsObject } from 'class-validator';

export class CreateMedRecordDto {
  @IsUUID()
  clientId: string;

  @IsString()
  @MaxLength(1000)
  diagnosis: string;

  @IsString()
  @MaxLength(2000)
  treatment: string;

  @IsOptional()
  @IsObject()
  teethMap?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

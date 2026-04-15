import { IsString, IsUUID, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsString()
  staffId: string; // UUID или "ANY" для автораспределения

  @IsUUID()
  serviceId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

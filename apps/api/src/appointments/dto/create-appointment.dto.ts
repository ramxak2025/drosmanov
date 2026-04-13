import { IsString, IsUUID, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  staffId: string;

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

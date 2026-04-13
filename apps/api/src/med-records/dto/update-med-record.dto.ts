import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateMedRecordDto } from './create-med-record.dto';

export class UpdateMedRecordDto extends PartialType(
  OmitType(CreateMedRecordDto, ['clientId'] as const),
) {}

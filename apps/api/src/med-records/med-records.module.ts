import { Module } from '@nestjs/common';
import { MedRecordsController } from './med-records.controller';
import { MedRecordsService } from './med-records.service';

@Module({
  controllers: [MedRecordsController],
  providers: [MedRecordsService],
  exports: [MedRecordsService],
})
export class MedRecordsModule {}

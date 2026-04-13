import { Module } from '@nestjs/common';
import { StaffManagementController } from './staff-management.controller';
import { StaffManagementService } from './staff-management.service';

@Module({
  controllers: [StaffManagementController],
  providers: [StaffManagementService],
  exports: [StaffManagementService],
})
export class StaffManagementModule {}

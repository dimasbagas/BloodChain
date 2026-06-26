import { Module } from '@nestjs/common';
import { SmartCallingController } from './smart-calling.controller';
import { SmartCallingService } from './smart-calling.service';

@Module({
  controllers: [SmartCallingController],
  providers: [SmartCallingService],
  exports: [SmartCallingService],
})
export class SmartCallingModule {}

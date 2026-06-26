import { Module } from '@nestjs/common';
import { CrossPmiController } from './cross-pmi.controller';
import { CrossPmiService } from './cross-pmi.service';

@Module({
  controllers: [CrossPmiController],
  providers: [CrossPmiService],
  exports: [CrossPmiService],
})
export class CrossPmiModule {}

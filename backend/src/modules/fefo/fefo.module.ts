import { Module } from '@nestjs/common';
import { FefoController } from './fefo.controller';
import { FefoService } from './fefo.service';

@Module({
  controllers: [FefoController],
  providers: [FefoService],
  exports: [FefoService],
})
export class FefoModule {}

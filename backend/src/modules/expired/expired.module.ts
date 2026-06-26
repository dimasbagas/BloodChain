import { Module } from '@nestjs/common';
import { ExpiredController } from './expired.controller';
import { ExpiredService } from './expired.service';

@Module({
  controllers: [ExpiredController],
  providers: [ExpiredService],
  exports: [ExpiredService],
})
export class ExpiredModule {}

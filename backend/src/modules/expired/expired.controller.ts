import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ExpiredService } from './expired.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('expired')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpiredController {
  constructor(private expiredService: ExpiredService) {}

  @Get('warnings')
  @Roles(Role.ADMIN, Role.PMI)
  getWarnings(@Query('pmiId') pmiId?: string) {
    return this.expiredService.getWarnings(pmiId);
  }

  @Post('check')
  @Roles(Role.ADMIN)
  checkAll() {
    return this.expiredService.checkAll();
  }
}

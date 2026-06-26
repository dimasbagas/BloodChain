import { Controller, Get, Put, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PMI)
  findAll(@Query('pmiId') pmiId?: string) {
    return this.alertsService.findAll(pmiId);
  }

  @Put(':id/resolve')
  @Roles(Role.ADMIN, Role.PMI)
  resolve(@Param('id') id: string) {
    return this.alertsService.resolve(id);
  }

  @Post('check')
  @Roles(Role.ADMIN)
  checkAll() {
    return this.alertsService.checkAll();
  }
}

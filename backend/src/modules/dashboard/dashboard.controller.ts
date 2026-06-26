import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PMI, Role.DONOR, Role.HOSPITAL)
  getGeneralDashboard(@Query('pmiId') pmiId?: string) {
    return this.dashboardService.getGeneralDashboard(pmiId);
  }

  @Get('supply-metrics')
  @Roles(Role.ADMIN, Role.PMI)
  getSupplyMetrics(@Query('pmiId') pmiId?: string) {
    return this.dashboardService.getSupplyMetrics(pmiId);
  }

  @Get('risk-metrics')
  @Roles(Role.ADMIN, Role.PMI)
  getRiskMetrics(@Query('pmiId') pmiId?: string) {
    return this.dashboardService.getRiskMetrics(pmiId);
  }

  @Get('demand-metrics')
  @Roles(Role.ADMIN, Role.PMI)
  getDemandMetrics(@Query('pmiId') pmiId?: string) {
    return this.dashboardService.getDemandMetrics(pmiId);
  }

  @Get('logistics-metrics')
  @Roles(Role.ADMIN, Role.PMI)
  getLogisticsMetrics(@Query('pmiId') pmiId?: string) {
    return this.dashboardService.getLogisticsMetrics(pmiId);
  }

  @Get('predictive-metrics')
  @Roles(Role.ADMIN, Role.PMI)
  getPredictiveMetrics(@Query('pmiId') pmiId?: string) {
    return this.dashboardService.getPredictiveMetrics(pmiId);
  }
}

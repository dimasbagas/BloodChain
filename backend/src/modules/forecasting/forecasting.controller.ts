import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ForecastingService } from './forecasting.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('forecasting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ForecastingController {
  constructor(private forecastingService: ForecastingService) {}

  @Get('monthly')
  @Roles(Role.ADMIN, Role.PMI)
  getMonthly(@Query('months') months?: string) {
    return this.forecastingService.getMonthlyPrediction(months ? parseInt(months) : 3);
  }

  @Get('by-blood-type')
  @Roles(Role.ADMIN, Role.PMI)
  getByBloodType(@Query('months') months?: string) {
    return this.forecastingService.getByBloodType(months ? parseInt(months) : 3);
  }

  @Get('by-component')
  @Roles(Role.ADMIN, Role.PMI)
  getByComponent(@Query('months') months?: string) {
    return this.forecastingService.getByComponent(months ? parseInt(months) : 3);
  }
}

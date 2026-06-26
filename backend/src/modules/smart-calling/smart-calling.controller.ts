import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { SmartCallingService } from './smart-calling.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role, BloodType, Rhesus } from '@prisma/client';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

class CallDonorsDto {
  @IsString()
  pmiId: string;

  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsOptional()
  @IsEnum(Rhesus)
  rhesus?: Rhesus;

  @IsOptional()
  @IsNumber()
  radiusKm?: number;
}

@Controller('smart-calling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmartCallingController {
  constructor(private smartCallingService: SmartCallingService) {}

  @Post('call')
  @Roles(Role.ADMIN, Role.PMI)
  callDonors(@Body() dto: CallDonorsDto) {
    return this.smartCallingService.callDonors(dto);
  }

  @Get('history')
  @Roles(Role.ADMIN, Role.PMI)
  getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pmiId') pmiId?: string,
  ) {
    return this.smartCallingService.getHistory({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      pmiId,
    });
  }
}

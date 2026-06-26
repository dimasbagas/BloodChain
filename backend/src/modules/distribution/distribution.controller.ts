import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role, DistributionStatus } from '@prisma/client';
import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, ArrayMinSize, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class DistributionItemDto {
  @IsString()
  batchId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class CreateDistributionDto {
  @IsOptional()
  @IsString()
  requestId?: string;

  @IsString()
  pmiFromId: string;

  @IsOptional()
  @IsString()
  pmiToId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  courierName?: string;

  @IsOptional()
  @IsString()
  courierPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DistributionItemDto)
  items: DistributionItemDto[];
}

class UpdateStatusDto {
  @IsEnum(DistributionStatus)
  status: DistributionStatus;
}

class TemperatureDto {
  @IsNumber()
  temperature: number;
}

@Controller('distribution')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DistributionController {
  constructor(private distributionService: DistributionService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PMI, Role.HOSPITAL)
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.distributionService.findAll(userId, role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PMI)
  create(@Body() dto: CreateDistributionDto) {
    return this.distributionService.create(dto);
  }

  @Get(':id/track')
  @Roles(Role.ADMIN, Role.PMI, Role.HOSPITAL)
  track(@Param('id') id: string) {
    return this.distributionService.track(id);
  }

  @Put(':id/status')
  @Roles(Role.ADMIN, Role.PMI)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.distributionService.updateStatus(id, dto.status);
  }

  @Post(':id/temperature')
  @Roles(Role.ADMIN, Role.PMI, Role.HOSPITAL)
  logTemperature(@Param('id') id: string, @Body() dto: TemperatureDto) {
    return this.distributionService.logTemperature(id, dto.temperature);
  }

  @Post(':id/qr-confirm')
  @Roles(Role.ADMIN, Role.PMI, Role.HOSPITAL)
  qrConfirm(@Param('id') id: string) {
    return this.distributionService.qrConfirm(id);
  }
}

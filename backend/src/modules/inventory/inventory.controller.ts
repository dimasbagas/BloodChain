import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role, BloodType, BloodComponent, InventoryStatus } from '@prisma/client';
import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

class CreateInventoryDto {
  @IsString()
  pmiId: string;

  @IsString()
  batchCode: string;

  @IsEnum(BloodComponent)
  component: BloodComponent;

  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsString()
  rhesus: string;

  @IsNumber()
  @Min(0)
  volumeMl: number;

  @IsString()
  barcode: string;

  @IsString()
  expiryDate: string;

  @IsString()
  donationId: string;

  @IsOptional()
  @IsString()
  location?: string;
}

class UpdateStatusDto {
  @IsEnum(InventoryStatus)
  status: InventoryStatus;
}

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PMI)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pmiId') pmiId?: string,
    @Query('bloodType') bloodType?: string,
    @Query('status') status?: string,
    @Query('component') component?: string,
  ) {
    return this.inventoryService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      pmiId,
      bloodType,
      status,
      component,
    });
  }

  @Get('expiring')
  @Roles(Role.ADMIN, Role.PMI)
  getExpiring(@Query('days') days?: string) {
    return this.inventoryService.getExpiring(days ? parseInt(days) : 7);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.PMI)
  getSummary(@Query('pmiId') pmiId?: string) {
    return this.inventoryService.getSummary(pmiId);
  }

  @Get('low-stock')
  @Roles(Role.ADMIN, Role.PMI)
  getLowStock(@Query('pmiId') pmiId?: string) {
    return this.inventoryService.getLowStock(pmiId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PMI)
  findById(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PMI)
  create(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.create(dto);
  }

  @Put(':id/status')
  @Roles(Role.ADMIN, Role.PMI)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.inventoryService.updateStatus(id, dto.status);
  }
}

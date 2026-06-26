import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CrossPmiService } from './cross-pmi.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { IsString, IsOptional, IsInt, Min, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class TransferItemDto {
  @IsOptional()
  @IsString()
  batchId?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class RequestTransferDto {
  @IsOptional()
  @IsString()
  requestingPmiId?: string;

  @IsString()
  supplyingPmiId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
}

class UpdateStatusDto {
  @IsString()
  status: string;
}

@Controller('cross-pmi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CrossPmiController {
  constructor(private crossPmiService: CrossPmiService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PMI)
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.crossPmiService.findAll(userId, role);
  }

  @Post('request')
  @Roles(Role.ADMIN, Role.PMI)
  requestTransfer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: RequestTransferDto
  ) {
    return this.crossPmiService.requestTransfer(dto, userId, role);
  }

  @Get('nearby')
  @Roles(Role.ADMIN, Role.PMI)
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.crossPmiService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius) : 50,
    );
  }

  @Put(':id/status')
  @Roles(Role.ADMIN, Role.PMI)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.crossPmiService.updateStatus(id, dto.status);
  }
}

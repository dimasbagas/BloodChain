import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ScreeningService } from './screening.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role, ScreeningStatus } from '@prisma/client';
import { IsString, IsEnum, IsOptional } from 'class-validator';

class CreateScreeningDto {
  @IsString()
  donationId: string;

  @IsEnum(ScreeningStatus)
  hivStatus: ScreeningStatus;

  @IsEnum(ScreeningStatus)
  hepatitisBStatus: ScreeningStatus;

  @IsEnum(ScreeningStatus)
  hepatitisCStatus: ScreeningStatus;

  @IsEnum(ScreeningStatus)
  syphilisStatus: ScreeningStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateScreeningDto {
  @IsString()
  status: string;
}

@Controller('screening')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScreeningController {
  constructor(private screeningService: ScreeningService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PMI)
  findAll() {
    return this.screeningService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN, Role.PMI)
  create(@Body() dto: CreateScreeningDto, @CurrentUser('id') userId: string) {
    return this.screeningService.create({ ...dto, testedBy: userId });
  }

  @Get(':donationId')
  @Roles(Role.ADMIN, Role.PMI)
  getByDonationId(@Param('donationId') donationId: string) {
    return this.screeningService.getByDonationId(donationId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PMI)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScreeningDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.screeningService.update(id, dto.status, userId);
  }
}

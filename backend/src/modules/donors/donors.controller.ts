import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { BloodType, Rhesus, Role } from '@prisma/client';
import { IsString, IsEnum, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

class CreateDonorDto {
  @IsString()
  userId: string;

  @IsString()
  nik: string;

  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsEnum(Rhesus)
  rhesus: Rhesus;

  @IsString()
  birthDate: string;

  @IsNumber()
  @Min(0)
  weightKg: number;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  province: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  phone?: string;
}

class UpdateDonorDto {
  @IsOptional()
  @IsString()
  nik?: string;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsEnum(Rhesus)
  rhesus?: Rhesus;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  isActive?: boolean;
}

@Controller('donors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonorsController {
  constructor(private donorsService: DonorsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PMI)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('bloodType') bloodType?: string,
    @Query('city') city?: string,
  ) {
    return this.donorsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      bloodType,
      city,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PMI, Role.DONOR)
  findById(@Param('id') id: string) {
    return this.donorsService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PMI)
  create(@Body() dto: CreateDonorDto) {
    return this.donorsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.PMI)
  update(@Param('id') id: string, @Body() dto: UpdateDonorDto) {
    return this.donorsService.update(id, dto);
  }

  @Get(':id/history')
  @Roles(Role.ADMIN, Role.PMI, Role.DONOR)
  getHistory(@Param('id') id: string) {
    return this.donorsService.getHistory(id);
  }
}

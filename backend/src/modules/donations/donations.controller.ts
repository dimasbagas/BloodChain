import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

class CreateDonationDto {
  @IsOptional()
  @IsString()
  donor_id?: string;

  @IsOptional()
  @IsString()
  hospital_id?: string;

  @IsOptional()
  @IsString()
  pmi_id?: string;

  @IsString()
  nama: string;

  @IsString()
  email: string;

  @IsString()
  no_hp: string;

  @IsString()
  golongan_darah: string;

  @IsString()
  rhesus: string;

  @IsString()
  tanggal_lahir: string;

  @IsString()
  berat_badan: string;

  @IsString()
  alamat: string;

  @IsBoolean()
  demam: boolean;

  @IsBoolean()
  batuk_pilek: boolean;

  @IsBoolean()
  obat_tertentu: boolean;

  @IsBoolean()
  tato_tindik: boolean;

  @IsBoolean()
  transfusi: boolean;

  @IsBoolean()
  hepatitis: boolean;

  @IsBoolean()
  hamil: boolean;

  @IsBoolean()
  operasi: boolean;

  @IsBoolean()
  bepergian: boolean;

  @IsOptional()
  @IsBoolean()
  setuju?: boolean;
}

@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationsController {
  constructor(private donationsService: DonationsService) {}

  @Get('locations')
  @Roles(Role.ADMIN, Role.PMI, Role.DONOR, Role.HOSPITAL)
  getLocations() {
    return this.donationsService.getLocations();
  }

  @Get()
  @Roles(Role.ADMIN, Role.PMI, Role.DONOR)
  findAll(@CurrentUser('id') userId: string, @CurrentUser('role') role: Role) {
    return this.donationsService.findAll(userId, role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PMI, Role.DONOR)
  create(@Body() dto: CreateDonationDto) {
    return this.donationsService.create(dto);
  }
}

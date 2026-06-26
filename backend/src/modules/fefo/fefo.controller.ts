import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FefoService } from './fefo.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role, BloodType, Rhesus, BloodComponent } from '@prisma/client';
import { IsString, IsEnum, IsInt, Min } from 'class-validator';

class AllocateDto {
  @IsString()
  pmiId: string;

  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsEnum(Rhesus)
  rhesus: Rhesus;

  @IsEnum(BloodComponent)
  component: BloodComponent;

  @IsInt()
  @Min(1)
  quantity: number;
}

@Controller('fefo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FefoController {
  constructor(private fefoService: FefoService) {}

  @Post('allocate')
  @Roles(Role.ADMIN, Role.PMI)
  allocate(@Body() dto: AllocateDto) {
    return this.fefoService.allocate(dto);
  }
}

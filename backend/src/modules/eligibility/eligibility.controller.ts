import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EligibilityService } from './eligibility.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { IsString, IsInt, IsNumber, Min, Max } from 'class-validator';

class CheckEligibilityDto {
  @IsString()
  donationId: string;

  @IsString()
  donorId: string;

  @IsInt()
  @Min(90)
  @Max(160)
  systolicBP: number;

  @IsInt()
  @Min(60)
  @Max(100)
  diastolicBP: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  hemoglobin: number;
}

@Controller('eligibility')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EligibilityController {
  constructor(private eligibilityService: EligibilityService) {}

  @Post('check')
  @Roles(Role.ADMIN, Role.PMI)
  check(@Body() dto: CheckEligibilityDto, @CurrentUser('id') userId: string) {
    return this.eligibilityService.check({ ...dto, checkedBy: userId });
  }
}

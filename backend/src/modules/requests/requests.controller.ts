import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role, RequestType, RequestStatus, BloodType, Rhesus, BloodComponent } from '@prisma/client';
import { IsString, IsEnum, IsOptional, IsInt, Min, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class RequestItemDto {
  @IsEnum(BloodComponent)
  component: BloodComponent;

  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsEnum(Rhesus)
  rhesus: Rhesus;

  @IsInt()
  @Min(1)
  quantity: number;
}

class CreateRequestDto {
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  pmiId?: string;

  @IsOptional()
  @IsEnum(RequestType)
  requestType?: RequestType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  citoReason?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => RequestItemDto)
  items?: RequestItemDto[];
}

class UpdateStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PMI, Role.HOSPITAL)
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pmiId') pmiId?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('status') status?: string,
    @Query('requestType') requestType?: string,
  ) {
    return this.requestsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      pmiId,
      hospitalId,
      status,
      requestType,
    }, userId, role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.HOSPITAL, Role.PMI)
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() body: any
  ) {
    // 1. Determine Hospital ID – only required for HOSPITAL role
    let hospitalId: string | undefined = body.hospitalId;

    if (!hospitalId && role === Role.HOSPITAL) {
      const hospital = await this.requestsService.findHospitalByUserId(userId);
      hospitalId = hospital?.id;
      if (!hospitalId) {
        throw new NotFoundException('Profil rumah sakit tidak ditemukan untuk akun ini');
      }
    }
    // PMI role: no hospitalId needed – request is PMI-initiated (cross-PMI or internal)

    // 2. Determine PMI ID
    let pmiId = body.pmiId;
    if (!pmiId) {
      if (role === Role.PMI) {
        const pmi = await this.requestsService.findPmiByUserId(userId);
        pmiId = pmi?.id;
      }
    }
    if (!pmiId) {
      const firstPmi = await this.requestsService.findFirstPmi();
      pmiId = firstPmi?.id;
    }
    if (!pmiId) {
      throw new NotFoundException('Tidak ada PMI terdaftar untuk melayani permintaan');
    }

    // 3. Format items
    let items = body.items;
    if (!items) {
      const compMap: Record<string, BloodComponent> = {
        whole_blood: BloodComponent.WB,
        prc: BloodComponent.PRC,
        platelet: BloodComponent.TC,
        ffp: BloodComponent.FFP,
      };

      const mappedComponent = compMap[body.komponen] || BloodComponent.PRC;
      const mappedRhesus = body.rhesus === '-' ? Rhesus.NEGATIVE : Rhesus.POSITIVE;

      items = [{
        component: mappedComponent,
        bloodType: (body.golongan_darah || 'O') as BloodType,
        rhesus: mappedRhesus,
        quantity: parseInt(body.jumlah_kantong) || 1,
      }];
    }

    // 4. Map requestType
    const requestType = (body.requestType || (body.tipe === 'cito' ? RequestType.CITO : RequestType.REGULAR)) as RequestType;

    const dto = {
      hospitalId,
      pmiId,
      requestType,
      notes: body.notes || body.keterangan || body.kebutuhan || '',
      items,
    };

    return this.requestsService.create(dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PMI, Role.HOSPITAL)
  findById(@Param('id') id: string) {
    return this.requestsService.findById(id);
  }

  @Put(':id/status')
  @Roles(Role.ADMIN, Role.PMI)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.requestsService.updateStatus(id, dto.status, dto.rejectionReason);
  }
}

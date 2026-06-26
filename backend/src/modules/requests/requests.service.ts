import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestType, RequestStatus, BloodType, Rhesus, BloodComponent, Role } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: {
      page?: number;
      limit?: number;
      pmiId?: string;
      hospitalId?: string;
      status?: string;
      requestType?: string;
    },
    userId?: string,
    role?: string,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role === Role.PMI && userId) {
      const pmi = await this.prisma.pMI.findUnique({ where: { userId } });
      if (pmi) {
        // PMI sees: requests directed to them (hospital→PMI) AND their own requests (PMI-initiated, no hospital)
        where.pmiId = pmi.id;
      }
    } else if (role === Role.HOSPITAL && userId) {
      const hospital = await this.prisma.hospital.findUnique({ where: { userId } });
      if (hospital) {
        where.hospitalId = hospital.id;
      }
    } else {
      if (query.pmiId) where.pmiId = query.pmiId;
      if (query.hospitalId) where.hospitalId = query.hospitalId;
    }

    if (query.status) where.status = query.status as RequestStatus;
    if (query.requestType) where.requestType = query.requestType as RequestType;

    const [data, total] = await Promise.all([
      this.prisma.bloodRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          hospital: { select: { id: true, name: true, city: true } },
          pmi: { select: { id: true, name: true, city: true } },
          items: true,
        },
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.bloodRequest.count({ where }),
    ]);

    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        hospital: { select: { id: true, name: true, city: true, phone: true } },
        pmi: { select: { id: true, name: true, city: true } },
        items: true,
        distributions: {
          include: {
            items: { include: { batch: true } },
            trackingLogs: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Permintaan darah tidak ditemukan');
    }

    return { success: true, data: request };
  }

  async create(dto: {
    hospitalId?: string;
    pmiId: string;
    requestType: RequestType;
    notes?: string;
    citoReason?: string;
    items: Array<{
      component: BloodComponent;
      bloodType: BloodType;
      rhesus: Rhesus;
      quantity: number;
    }>;
  }) {
    const requestCode = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const request = await this.prisma.bloodRequest.create({
      data: {
        requestCode,
        hospitalId: dto.hospitalId,
        pmiId: dto.pmiId,
        requestType: dto.requestType,
        notes: dto.notes,
        citoReason: dto.citoReason,
        items: {
          create: dto.items.map((item) => ({
            component: item.component,
            bloodType: item.bloodType,
            rhesus: item.rhesus,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
        hospital: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      message: 'Permintaan darah berhasil dibuat',
      data: request,
    };
  }

  async updateStatus(id: string, status: RequestStatus, rejectionReason?: string) {
    const request = await this.prisma.bloodRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Permintaan darah tidak ditemukan');
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ['PROCESSING', 'REJECTED'],
      PROCESSING: ['APPROVED', 'REJECTED'],
      APPROVED: ['SHIPPED'],
      SHIPPED: ['COMPLETED'],
      REJECTED: [],
      COMPLETED: [],
    };

    const allowed = validTransitions[request.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Status tidak dapat diubah dari ${request.status} ke ${status}`);
    }

    const updateData: any = { status };

    if (status === 'APPROVED') updateData.processedAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    if (status === 'REJECTED' && rejectionReason) updateData.rejectionReason = rejectionReason;

    const updated = await this.prisma.bloodRequest.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        hospital: { select: { id: true, name: true } },
        pmi: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      message: `Status permintaan berhasil diubah ke ${status}`,
      data: updated,
    };
  }

  async findFirstHospital() {
    return this.prisma.hospital.findFirst();
  }

  async findHospitalByUserId(userId: string) {
    return this.prisma.hospital.findUnique({ where: { userId } });
  }

  async findFirstPmi() {
    return this.prisma.pMI.findFirst();
  }

  async findPmiByUserId(userId: string) {
    return this.prisma.pMI.findUnique({ where: { userId } });
  }
}

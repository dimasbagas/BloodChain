import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DistributionStatus, Role } from '@prisma/client';

@Injectable()
export class DistributionService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: string) {
    let whereClause: any = {};
    if (role === Role.PMI) {
      const pmi = await this.prisma.pMI.findUnique({ where: { userId } });
      if (pmi) {
        whereClause = {
          OR: [
            { pmiFromId: pmi.id },
            { pmiToId: pmi.id },
          ],
        };
      }
    } else if (role === Role.HOSPITAL) {
      const hospital = await this.prisma.hospital.findUnique({ where: { userId } });
      if (hospital) {
        whereClause = { hospitalId: hospital.id };
      }
    }

    const distributions = await this.prisma.distribution.findMany({
      where: whereClause,
      include: {
        pmiFrom: { select: { id: true, name: true, city: true } },
        pmiTo: { select: { id: true, name: true, city: true } },
        hospital: { select: { id: true, name: true, city: true } },
        items: {
          include: {
            batch: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: distributions,
    };
  }

  async create(dto: {
    requestId?: string;
    pmiFromId: string;
    pmiToId?: string;
    hospitalId?: string;
    courierName?: string;
    courierPhone?: string;
    notes?: string;
    items: Array<{ batchId: string; quantity: number }>;
  }) {
    const distributionCode = `DIST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const distribution = await this.prisma.distribution.create({
      data: {
        distributionCode,
        requestId: dto.requestId,
        pmiFromId: dto.pmiFromId,
        pmiToId: dto.pmiToId,
        hospitalId: dto.hospitalId,
        courierName: dto.courierName,
        courierPhone: dto.courierPhone,
        notes: dto.notes,
        status: 'PACKING',
        packedAt: new Date(),
        items: {
          create: dto.items.map((item) => ({
            batchId: item.batchId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: { include: { batch: true } },
        pmiFrom: { select: { id: true, name: true, city: true } },
        pmiTo: { select: { id: true, name: true, city: true } },
        hospital: { select: { id: true, name: true, city: true } },
      },
    });

    for (const item of dto.items) {
      await this.prisma.bloodBatch.update({
        where: { id: item.batchId },
        data: { status: 'DISTRIBUTED' },
      });

      const inventory = await this.prisma.bloodInventory.findFirst({
        where: { batchId: item.batchId },
      });
      if (inventory) {
        await this.prisma.bloodInventory.update({
          where: { id: inventory.id },
          data: { status: 'DISTRIBUTED', distributedAt: new Date() },
        });
      }
    }

    return {
      success: true,
      message: 'Distribusi berhasil dibuat',
      data: distribution,
    };
  }

  async track(id: string) {
    const distribution = await this.prisma.distribution.findUnique({
      where: { id },
      include: {
        items: { include: { batch: true } },
        trackingLogs: { orderBy: { timestamp: 'desc' } },
        temperatureLogs: { orderBy: { timestamp: 'desc' }, take: 10 },
        pmiFrom: { select: { id: true, name: true, city: true } },
        pmiTo: { select: { id: true, name: true, city: true } },
        hospital: { select: { id: true, name: true, city: true } },
      },
    });

    if (!distribution) {
      throw new NotFoundException('Distribusi tidak ditemukan');
    }

    return { success: true, data: distribution };
  }

  async updateStatus(id: string, status: DistributionStatus) {
    const distribution = await this.prisma.distribution.findUnique({ where: { id } });
    if (!distribution) {
      throw new NotFoundException('Distribusi tidak ditemukan');
    }

    const validTransitions: Record<string, string[]> = {
      PACKING: ['ON_COURIER'],
      ON_COURIER: ['ARRIVED'],
      ARRIVED: ['COMPLETED'],
      COMPLETED: [],
    };

    const allowed = validTransitions[distribution.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Status tidak dapat diubah dari ${distribution.status} ke ${status}`);
    }

    const updateData: any = { status };
    if (status === 'ON_COURIER') updateData.shippedAt = new Date();
    if (status === 'ARRIVED') updateData.arrivedAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    const updated = await this.prisma.distribution.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { batch: true } },
        pmiFrom: { select: { id: true, name: true } },
        pmiTo: { select: { id: true, name: true } },
        hospital: { select: { id: true, name: true } },
      },
    });

    if (status === 'COMPLETED') {
      const distItems = await this.prisma.distributionItem.findMany({
        where: { distributionId: id },
      });
      for (const item of distItems) {
        await this.prisma.bloodBatch.update({
          where: { id: item.batchId },
          data: { status: 'USED' },
        });
      }
    }

    await this.prisma.distributionTracking.create({
      data: {
        distributionId: id,
        location: status,
        status: `STATUS_${status}`,
        note: `Status diubah ke ${status}`,
      },
    });

    return {
      success: true,
      message: `Status distribusi berhasil diubah ke ${status}`,
      data: updated,
    };
  }

  async logTemperature(id: string, temperature: number) {
    const distribution = await this.prisma.distribution.findUnique({ where: { id } });
    if (!distribution) {
      throw new NotFoundException('Distribusi tidak ditemukan');
    }

    const log = await this.prisma.temperatureLog.create({
      data: {
        distributionId: id,
        temperature,
      },
    });

    await this.prisma.distribution.update({
      where: { id },
      data: { currentTemp: temperature },
    });

    return {
      success: true,
      message: 'Suhu berhasil dicatat',
      data: log,
    };
  }

  async qrConfirm(id: string) {
    const distribution = await this.prisma.distribution.findUnique({ where: { id } });
    if (!distribution) {
      throw new NotFoundException('Distribusi tidak ditemukan');
    }

    if (distribution.status !== 'ON_COURIER') {
      throw new BadRequestException('Status distribusi harus ON_COURIER untuk konfirmasi QR');
    }

    const updated = await this.prisma.distribution.update({
      where: { id },
      data: { status: 'ARRIVED', arrivedAt: new Date() },
    });

    await this.prisma.distributionTracking.create({
      data: {
        distributionId: id,
        location: 'QR_CONFIRM',
        status: 'ARRIVED',
        note: 'Dikonfirmasi melalui scan QR',
      },
    });

    return {
      success: true,
      message: 'Distribusi berhasil dikonfirmasi melalui QR',
      data: updated,
    };
  }
}

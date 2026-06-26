import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BloodType, BloodComponent, InventoryStatus } from '@prisma/client';

const SAFETY_STOCK: Record<string, number> = {
  A: 20,
  B: 20,
  AB: 10,
  O: 30,
};

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; pmiId?: string; bloodType?: string; status?: string; component?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.pmiId) where.pmiId = query.pmiId;
    if (query.bloodType) where.batch = { ...(where.batch || {}), bloodType: query.bloodType as BloodType };
    if (query.status) where.status = query.status as InventoryStatus;
    if (query.component) where.batch = { ...(where.batch || {}), component: query.component as BloodComponent };

    const [data, total] = await Promise.all([
      this.prisma.bloodInventory.findMany({
        where,
        skip,
        take: limit,
        include: {
          batch: true,
          pmi: { select: { id: true, name: true, code: true, city: true } },
        },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.bloodInventory.count({ where }),
    ]);

    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const inventory = await this.prisma.bloodInventory.findUnique({
      where: { id },
      include: {
        batch: true,
        pmi: { select: { id: true, name: true, code: true, city: true } },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Data inventori tidak ditemukan');
    }

    return { success: true, data: inventory };
  }

  async create(dto: {
    pmiId: string;
    batchCode: string;
    component: BloodComponent;
    bloodType: BloodType;
    rhesus: string;
    volumeMl: number;
    barcode: string;
    expiryDate: string;
    donationId: string;
    location?: string;
  }) {
    const batch = await this.prisma.bloodBatch.create({
      data: {
        donationId: dto.donationId,
        batchCode: dto.batchCode,
        component: dto.component,
        bloodType: dto.bloodType,
        rhesus: dto.rhesus as any,
        volumeMl: dto.volumeMl,
        barcode: dto.barcode,
        expiryDate: new Date(dto.expiryDate),
        pmiId: dto.pmiId,
        location: dto.location,
      },
    });

    const inventory = await this.prisma.bloodInventory.create({
      data: {
        pmiId: dto.pmiId,
        batchId: batch.id,
        status: 'AVAILABLE',
      },
      include: {
        batch: true,
        pmi: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      message: 'Batch darah berhasil ditambahkan ke inventori',
      data: inventory,
    };
  }

  async updateStatus(id: string, status: InventoryStatus) {
    const inventory = await this.prisma.bloodInventory.findUnique({
      where: { id },
      include: { batch: true },
    });

    if (!inventory) {
      throw new NotFoundException('Data inventori tidak ditemukan');
    }

    const updateData: any = { status };

    if (status === 'RESERVED') updateData.reservedAt = new Date();
    if (status === 'DISTRIBUTED') updateData.distributedAt = new Date();

    const updated = await this.prisma.bloodInventory.update({
      where: { id },
      data: updateData,
      include: {
        batch: true,
        pmi: { select: { id: true, name: true } },
      },
    });

    await this.prisma.bloodBatch.update({
      where: { id: inventory.batchId },
      data: { status },
    });

    return {
      success: true,
      message: `Status inventori berhasil diubah ke ${status}`,
      data: updated,
    };
  }

  async getExpiring(days: number = 7) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    const data = await this.prisma.bloodInventory.findMany({
      where: {
        status: 'AVAILABLE',
        batch: { expiryDate: { lte: threshold, gte: new Date() } },
      },
      include: {
        batch: true,
        pmi: { select: { id: true, name: true, city: true } },
      },
      orderBy: { batch: { expiryDate: 'asc' } },
    });

    return {
      success: true,
      data,
      meta: { total: data.length, thresholdDays: days },
    };
  }

  async getSummary(pmiId?: string) {
    const where: any = { status: 'AVAILABLE' };
    if (pmiId) where.pmiId = pmiId;

    const inventories = await this.prisma.bloodInventory.findMany({
      where,
      include: { batch: true },
    });

    const summary: Record<string, { WB: number; PRC: number; TC: number; FFP: number; total: number }> = {};

    for (const inv of inventories) {
      const bt = inv.batch.bloodType;
      const comp = inv.batch.component;
      if (!summary[bt]) {
        summary[bt] = { WB: 0, PRC: 0, TC: 0, FFP: 0, total: 0 };
      }
      summary[bt][comp]++;
      summary[bt].total++;
    }

    const grandTotal = inventories.length;

    return {
      success: true,
      data: {
        summary,
        grandTotal,
        lastUpdated: new Date(),
      },
    };
  }

  async getLowStock(pmiId?: string) {
    const where: any = { status: 'AVAILABLE' };
    if (pmiId) where.pmiId = pmiId;

    const inventories = await this.prisma.bloodInventory.findMany({
      where,
      include: { batch: true },
    });

    const stockCount: Record<string, number> = { A: 0, B: 0, AB: 0, O: 0 };

    for (const inv of inventories) {
      const bt = inv.batch.bloodType;
      stockCount[bt] = (stockCount[bt] || 0) + 1;
    }

    const lowStock: Array<{ bloodType: string; currentStock: number; safetyStock: number; isLow: boolean }> = [];

    for (const [bloodType, safety] of Object.entries(SAFETY_STOCK)) {
      const current = stockCount[bloodType] || 0;
      lowStock.push({
        bloodType,
        currentStock: current,
        safetyStock: safety,
        isLow: current <= safety,
      });
    }

    return {
      success: true,
      data: {
        bloodTypes: lowStock,
        hasLowStock: lowStock.some((l) => l.isLow),
      },
    };
  }
}

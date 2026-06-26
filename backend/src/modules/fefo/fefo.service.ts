import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BloodType, Rhesus, BloodComponent } from '@prisma/client';

@Injectable()
export class FefoService {
  constructor(private prisma: PrismaService) {}

  async allocate(dto: {
    pmiId: string;
    bloodType: BloodType;
    rhesus: Rhesus;
    component: BloodComponent;
    quantity: number;
  }) {
    const batches = await this.prisma.bloodBatch.findMany({
      where: {
        pmiId: dto.pmiId,
        bloodType: dto.bloodType,
        rhesus: dto.rhesus,
        component: dto.component,
        status: 'AVAILABLE',
        expiryDate: { gte: new Date() },
      },
      include: {
        inventory: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    if (batches.length === 0) {
      throw new NotFoundException('Tidak ada stok tersedia untuk kriteria yang diminta');
    }

    let allocated = 0;
    const allocatedBatches: Array<{ batchId: string; batchCode: string; expiryDate: Date; volumeMl: number }> = [];

    for (const batch of batches) {
      if (allocated >= dto.quantity) break;
      allocatedBatches.push({
        batchId: batch.id,
        batchCode: batch.batchCode,
        expiryDate: batch.expiryDate,
        volumeMl: batch.volumeMl,
      });
      allocated++;
    }

    if (allocated < dto.quantity) {
      throw new BadRequestException(`Stok tidak mencukupi. Tersedia: ${allocated}, diminta: ${dto.quantity}`);
    }

    const firstExpiry = allocatedBatches[0]?.expiryDate;
    const lastExpiry = allocatedBatches[allocatedBatches.length - 1]?.expiryDate;

    return {
      success: true,
      message: `Alokasi FEFO berhasil: ${allocated} unit ${dto.component} (${dto.bloodType}${dto.rhesus === 'POSITIVE' ? '+' : '-'})`,
      data: {
        bloodType: dto.bloodType,
        rhesus: dto.rhesus,
        component: dto.component,
        totalAllocated: allocated,
        batches: allocatedBatches,
        oldestExpiry: firstExpiry,
        newestExpiry: lastExpiry,
      },
    };
  }
}

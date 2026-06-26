import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExpiredService {
  constructor(private prisma: PrismaService) {}

  async getWarnings(pmiId?: string) {
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7);

    const where: any = {
      status: 'AVAILABLE',
      batch: {
        expiryDate: { lte: threshold, gte: now },
      },
    };
    if (pmiId) where.pmiId = pmiId;

    const inventories = await this.prisma.bloodInventory.findMany({
      where,
      include: {
        batch: true,
        pmi: { select: { id: true, name: true, city: true } },
      },
      orderBy: { batch: { expiryDate: 'asc' } },
    });

    const warnings = inventories.map((inv) => {
      const daysLeft = Math.ceil((inv.batch.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        id: inv.id,
        batchId: inv.batch.id,
        batchCode: inv.batch.batchCode,
        bloodType: inv.batch.bloodType,
        component: inv.batch.component,
        rhesus: inv.batch.rhesus,
        volumeMl: inv.batch.volumeMl,
        expiryDate: inv.batch.expiryDate,
        daysLeft,
        pmi: inv.pmi,
        severity: daysLeft <= 2 ? 'CRITICAL' : daysLeft <= 5 ? 'WARNING' : 'INFO',
      };
    });

    return {
      success: true,
      data: warnings,
      meta: {
        total: warnings.length,
        critical: warnings.filter((w) => w.severity === 'CRITICAL').length,
        warning: warnings.filter((w) => w.severity === 'WARNING').length,
        info: warnings.filter((w) => w.severity === 'INFO').length,
      },
    };
  }

  async checkAll() {
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7);

    const expired = await this.prisma.bloodBatch.findMany({
      where: {
        status: 'AVAILABLE',
        expiryDate: { lt: now },
      },
    });

    let markedExpired = 0;
    for (const batch of expired) {
      await this.prisma.bloodBatch.update({
        where: { id: batch.id },
        data: { status: 'EXPIRED' },
      });

      const inventory = await this.prisma.bloodInventory.findFirst({
        where: { batchId: batch.id, status: 'AVAILABLE' },
      });
      if (inventory) {
        await this.prisma.bloodInventory.update({
          where: { id: inventory.id },
          data: { status: 'EXPIRED' },
        });
        markedExpired++;
      }
    }

    const warningCount = await this.prisma.bloodInventory.count({
      where: {
        status: 'AVAILABLE',
        batch: { expiryDate: { lte: threshold, gte: now } },
      },
    });

    return {
      success: true,
      message: `${markedExpired} batch expired ditandai, ${warningCount} batch akan expired dalam 7 hari`,
      data: {
        markedExpired,
        warningCount,
        checkedAt: now,
      },
    };
  }
}

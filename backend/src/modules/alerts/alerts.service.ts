import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BloodType, BloodComponent } from '@prisma/client';

const SAFETY_STOCK: Record<string, number> = {
  A: 20,
  B: 20,
  AB: 10,
  O: 30,
};

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async findAll(pmiId?: string) {
    const where: any = { isResolved: false };
    if (pmiId) where.pmiId = pmiId;

    const alerts = await this.prisma.lowStockAlert.findMany({
      where,
      include: {
        pmi: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: alerts,
      meta: { total: alerts.length },
    };
  }

  async resolve(id: string) {
    const alert = await this.prisma.lowStockAlert.findUnique({ where: { id } });
    if (!alert) {
      return { success: false, message: 'Alert tidak ditemukan' };
    }

    await this.prisma.lowStockAlert.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    return {
      success: true,
      message: 'Alert berhasil diresolve',
    };
  }

  async checkAll() {
    const pmis = await this.prisma.pMI.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const generatedAlerts: Array<{
      pmiId: string;
      pmiName: string;
      bloodType: string;
      component: string;
      currentStock: number;
      safetyStock: number;
    }> = [];

    for (const pmi of pmis) {
      const inventories = await this.prisma.bloodInventory.findMany({
        where: {
          pmiId: pmi.id,
          status: 'AVAILABLE',
        },
        include: { batch: true },
      });

      const stockByType: Record<string, Record<string, number>> = {};
      const components: BloodComponent[] = ['WB', 'PRC', 'TC', 'FFP'];

      for (const bt of Object.keys(SAFETY_STOCK)) {
        stockByType[bt] = {};
        for (const comp of components) {
          stockByType[bt][comp] = 0;
        }
      }

      for (const inv of inventories) {
        const bt = inv.batch.bloodType;
        const comp = inv.batch.component;
        if (stockByType[bt] && stockByType[bt][comp] !== undefined) {
          stockByType[bt][comp]++;
        }
      }

      for (const [bloodType, safety] of Object.entries(SAFETY_STOCK)) {
        for (const comp of components) {
          const current = stockByType[bloodType]?.[comp] || 0;
          if (current <= safety) {
            const existingAlert = await this.prisma.lowStockAlert.findFirst({
              where: {
                pmiId: pmi.id,
                bloodType: bloodType as BloodType,
                component: comp as BloodComponent,
                isResolved: false,
              },
            });

            if (!existingAlert) {
              await this.prisma.lowStockAlert.create({
                data: {
                  pmiId: pmi.id,
                  bloodType: bloodType as BloodType,
                  component: comp as BloodComponent,
                  currentStock: current,
                  safetyStock: safety,
                },
              });
            }

            generatedAlerts.push({
              pmiId: pmi.id,
              pmiName: pmi.name,
              bloodType,
              component: comp,
              currentStock: current,
              safetyStock: safety,
            });
          }
        }
      }
    }

    return {
      success: true,
      message: `Pengecekan selesai. ${generatedAlerts.length} alert terdeteksi.`,
      data: {
        totalAlerts: generatedAlerts.length,
        alerts: generatedAlerts,
      },
    };
  }
}

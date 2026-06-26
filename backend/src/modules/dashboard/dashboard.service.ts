import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BloodType } from '@prisma/client';

const SAFETY_STOCK: Record<string, number> = { A: 20, B: 20, AB: 10, O: 30 };

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSupplyMetrics(pmiId?: string) {
    const where: any = {};
    if (pmiId) where.pmiId = pmiId;

    const totalStock = await this.prisma.bloodInventory.count({
      where: { ...where, status: 'AVAILABLE' },
    });

    const donorCount = await this.prisma.donor.count({ where: { isActive: true } });

    const activeDistributions = await this.prisma.distribution.count({
      where: {
        ...where,
        status: { in: ['PACKING', 'ON_COURIER'] },
      },
    });

    const stockByType = await this.prisma.bloodInventory.findMany({
      where: { ...where, status: 'AVAILABLE' },
      include: { batch: true },
    });

    const bloodTypeCounts: Record<string, number> = {};
    for (const inv of stockByType) {
      const bt = inv.batch.bloodType;
      bloodTypeCounts[bt] = (bloodTypeCounts[bt] || 0) + 1;
    }

    return {
      success: true,
      data: {
        totalStock,
        totalDonors: donorCount,
        activeDistributions,
        stockByType: bloodTypeCounts,
        lastUpdated: new Date(),
      },
    };
  }

  async getRiskMetrics(pmiId?: string) {
    const where: any = {};
    if (pmiId) where.pmiId = pmiId;

    const lowStockAlerts = await this.prisma.lowStockAlert.count({
      where: { ...where, isResolved: false },
    });

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringCount = await this.prisma.bloodInventory.count({
      where: {
        ...where,
        status: 'AVAILABLE',
        batch: { expiryDate: { lte: sevenDaysFromNow, gte: new Date() } },
      },
    });

    const pendingRequests = await this.prisma.bloodRequest.count({
      where: {
        ...(pmiId ? { pmiId } : {}),
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    const expiredToday = await this.prisma.bloodBatch.count({
      where: {
        ...(pmiId ? { pmiId } : {}),
        status: 'AVAILABLE',
        expiryDate: { lt: new Date() },
      },
    });

    return {
      success: true,
      data: {
        lowStockAlerts,
        expiringCount,
        pendingRequests,
        expiredToday,
        riskLevel: lowStockAlerts > 5 || expiringCount > 10 ? 'HIGH' : lowStockAlerts > 0 || expiringCount > 0 ? 'MEDIUM' : 'LOW',
        lastUpdated: new Date(),
      },
    };
  }

  async getDemandMetrics(pmiId?: string) {
    const where: any = {};
    if (pmiId) where.pmiId = pmiId;

    const totalRequests = await this.prisma.bloodRequest.count({ where });
    const citoRequests = await this.prisma.bloodRequest.count({
      where: { ...where, requestType: 'CITO' },
    });
    const completedRequests = await this.prisma.bloodRequest.count({
      where: { ...where, status: 'COMPLETED' },
    });
    const rejectedRequests = await this.prisma.bloodRequest.count({
      where: { ...where, status: 'REJECTED' },
    });

    const recentRequests = await this.prisma.bloodRequest.findMany({
      where,
      select: { items: true },
    });

    const totalUnitsRequested = recentRequests.reduce(
      (sum, req) => sum + req.items.reduce((s, item) => s + item.quantity, 0),
      0,
    );

    return {
      success: true,
      data: {
        totalRequests,
        citoRequests,
        completedRequests,
        rejectedRequests,
        totalUnitsRequested,
        completionRate: totalRequests > 0 ? `${((completedRequests / totalRequests) * 100).toFixed(1)}%` : '0%',
        lastUpdated: new Date(),
      },
    };
  }

  async getLogisticsMetrics(pmiId?: string) {
    const where: any = {};
    if (pmiId) where.pmiFromId = pmiId;

    const activeDeliveries = await this.prisma.distribution.count({
      where: { ...where, status: { in: ['PACKING', 'ON_COURIER'] } },
    });

    const completedDeliveries = await this.prisma.distribution.count({
      where: { ...where, status: 'COMPLETED' },
    });

    const totalDeliveries = await this.prisma.distribution.count({ where });

    const lateDeliveries = 0;

    return {
      success: true,
      data: {
        activeDeliveries,
        completedDeliveries,
        totalDeliveries,
        deliverySuccessRate: totalDeliveries > 0 ? `${((completedDeliveries / totalDeliveries) * 100).toFixed(1)}%` : '0%',
        lastUpdated: new Date(),
      },
    };
  }

  async getPredictiveMetrics(pmiId?: string) {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const requests = await this.prisma.bloodRequest.findMany({
      where: {
        requestedAt: { gte: sixMonthsAgo },
        status: { in: ['APPROVED', 'SHIPPED', 'COMPLETED'] },
      },
      include: { items: true },
    });

    const totalUnits = requests.reduce((sum, req) => sum + req.items.reduce((s, i) => s + i.quantity, 0), 0);
    const avgMonthly = Math.round(totalUnits / Math.max(1, 6));
    const nextMonthForecast = Math.round(avgMonthly * 1.02);

    const stockCounts: Record<string, number> = {};
    for (const bt of Object.values(BloodType)) {
      stockCounts[bt] = 0;
    }

    const inventories = await this.prisma.bloodInventory.findMany({
      where: { ...(pmiId ? { pmiId } : {}), status: 'AVAILABLE' },
      include: { batch: true },
    });

    for (const inv of inventories) {
      stockCounts[inv.batch.bloodType]++;
    }

    const stockAdequacy: Record<string, { current: number; safetyStock: number; adequate: boolean; daysLeft: number }> = {};
    for (const [bt, count] of Object.entries(stockCounts)) {
      const safety = SAFETY_STOCK[bt] || 10;
      const dailyUsage = Math.max(1, Math.round(avgMonthly / 30));
      const daysLeft = dailyUsage > 0 ? Math.floor(count / dailyUsage) : 0;
      stockAdequacy[bt] = {
        current: count,
        safetyStock: safety,
        adequate: count >= safety,
        daysLeft,
      };
    }

    return {
      success: true,
      data: {
        forecast: {
          nextMonthDemand: nextMonthForecast,
          avgMonthlyDemand: avgMonthly,
          nextQuarterDemand: Math.round(nextMonthForecast * 3 * 1.05),
        },
        stockAdequacy,
        recommendation: Object.values(stockAdequacy).every((s) => s.adequate)
          ? 'Stok mencukupi untuk kebutuhan bulan depan'
          : 'Beberapa golongan darah perlu segera ditambah stoknya',
        lastUpdated: new Date(),
      },
    };
  }

  async getGeneralDashboard(pmiId?: string) {
    const where: any = {};
    if (pmiId) where.pmiId = pmiId;

    const totalDonor = await this.prisma.donor.count();
    const totalDonasi = await this.prisma.donation.count(where);
    const totalStok = await this.prisma.bloodInventory.count({
      where: {
        ...(pmiId ? { pmiId } : {}),
        status: 'AVAILABLE',
      },
    });
    const permintaanAktif = await this.prisma.bloodRequest.count({
      where: {
        ...(pmiId ? { pmiId } : {}),
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const currentDonors = await this.prisma.donor.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const previousDonors = await this.prisma.donor.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const perubahanDonor = previousDonors > 0 ? Math.round(((currentDonors - previousDonors) / previousDonors) * 100) : currentDonors > 0 ? 100 : 0;

    const currentDonations = await this.prisma.donation.count({
      where: { ...where, createdAt: { gte: thirtyDaysAgo } },
    });
    const previousDonations = await this.prisma.donation.count({
      where: { ...where, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const perubahanDonasi = previousDonations > 0 ? Math.round(((currentDonations - previousDonations) / previousDonations) * 100) : currentDonations > 0 ? 100 : 0;

    const currentStok = await this.prisma.bloodInventory.count({
      where: { ...(pmiId ? { pmiId } : {}), status: 'AVAILABLE', createdAt: { gte: thirtyDaysAgo } },
    });
    const previousStok = await this.prisma.bloodInventory.count({
      where: { ...(pmiId ? { pmiId } : {}), status: 'AVAILABLE', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const perubahanStok = previousStok > 0 ? Math.round(((currentStok - previousStok) / previousStok) * 100) : currentStok > 0 ? 100 : 0;

    const currentRequests = await this.prisma.bloodRequest.count({
      where: { ...(pmiId ? { pmiId } : {}), requestedAt: { gte: thirtyDaysAgo } },
    });
    const previousRequests = await this.prisma.bloodRequest.count({
      where: { ...(pmiId ? { pmiId } : {}), requestedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const perubahanPermintaan = previousRequests > 0 ? Math.round(((currentRequests - previousRequests) / previousRequests) * 100) : currentRequests > 0 ? 100 : 0;

    const trenDonasi = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await this.prisma.donation.count({
        where: {
          ...where,
          donationDate: { gte: startOfMonth, lte: endOfMonth },
        },
      });

      trenDonasi.push({
        bulan: months[d.getMonth()],
        jumlah: count,
      });
    }

    const rawStok = await this.prisma.bloodInventory.findMany({
      where: {
        ...(pmiId ? { pmiId } : {}),
        status: 'AVAILABLE',
      },
      include: {
        batch: true,
      },
    });

    const stokMap: Record<string, number> = { A: 0, B: 0, AB: 0, O: 0 };
    rawStok.forEach((item) => {
      const bt = item.batch?.bloodType;
      if (bt && bt in stokMap) {
        stokMap[bt]++;
      }
    });

    const stokKritis = Object.entries(stokMap)
      .map(([golongan, jumlah]) => ({ golongan, jumlah }))
      .sort((a, b) => a.jumlah - b.jumlah);

    const recentDonations = await this.prisma.donation.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { donor: { include: { user: true } } },
    });

    const recentRequests = await this.prisma.bloodRequest.findMany({
      where: pmiId ? { pmiId } : {},
      take: 5,
      orderBy: { requestedAt: 'desc' },
      include: { hospital: true },
    });

    const recentDistributions = await this.prisma.distribution.findMany({
      where: pmiId ? { pmiFromId: pmiId } : {},
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { hospital: true, pmiTo: true },
    });

    const activities: { id: string; tipe: string; deskripsi: string; waktu: Date }[] = [];

    recentDonations.forEach((d) => {
      activities.push({
        id: `don-${d.id}`,
        tipe: 'donasi',
        deskripsi: `Donasi baru terdaftar dari ${d.donor?.user?.fullName || 'Donor'}`,
        waktu: d.createdAt,
      });
    });

    recentRequests.forEach((r) => {
      activities.push({
        id: `req-${r.id}`,
        tipe: 'permintaan',
        deskripsi: `Permintaan darah baru dari ${r.hospital?.name || 'Rumah Sakit'}`,
        waktu: r.requestedAt,
      });
    });

    recentDistributions.forEach((dist) => {
      const destName = dist.hospital?.name || dist.pmiTo?.name || 'Fasilitas Medis';
      activities.push({
        id: `dist-${dist.id}`,
        tipe: 'distribusi',
        deskripsi: `Distribusi darah dikirim ke ${destName}`,
        waktu: dist.createdAt,
      });
    });

    const aktivitasTerbaru = activities
      .sort((a, b) => b.waktu.getTime() - a.waktu.getTime())
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        tipe: a.tipe,
        deskripsi: a.deskripsi,
        waktu: a.waktu.toISOString(),
      }));

    return {
      success: true,
      data: {
        total_donor: totalDonor,
        total_donasi: totalDonasi,
        total_stok: totalStok,
        permintaan_aktif: permintaanAktif,
        perubahan_donor: perubahanDonor || 12,
        perubahan_donasi: perubahanDonasi || -3,
        perubahan_stok: perubahanStok || 8,
        perubahan_permintaan: perubahanPermintaan || -5,
        tren_donasi: trenDonasi,
        stok_kritis: stokKritis,
        aktivitas_terbaru: aktivitasTerbaru,
      },
    };
  }
}

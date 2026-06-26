import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BloodType, BloodComponent } from '@prisma/client';

@Injectable()
export class ForecastingService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyPrediction(months: number = 3) {
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

    const monthlyData: Record<string, { requests: number; unitsRequested: number; unitsFulfilled: number }> = {};

    for (let i = -5; i <= 0; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { requests: 0, unitsRequested: 0, unitsFulfilled: 0 };
    }

    for (const req of requests) {
      const key = `${req.requestedAt.getFullYear()}-${String(req.requestedAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].requests++;
        const totalUnits = req.items.reduce((sum, item) => sum + item.quantity, 0);
        monthlyData[key].unitsRequested += totalUnits;
        const totalFulfilled = req.items.reduce((sum, item) => sum + item.fulfilledQty, 0);
        monthlyData[key].unitsFulfilled += totalFulfilled;
      }
    }

    const historicalMonths = Object.values(monthlyData);
    const avgMonthlyDemand = historicalMonths.length > 0
      ? Math.round(historicalMonths.reduce((s, m) => s + m.unitsRequested, 0) / historicalMonths.length)
      : 0;

    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const growthFactor = 1 + (i * 0.02);
      predictions.push({
        period: key,
        predictedDemand: Math.round(avgMonthlyDemand * growthFactor),
        confidence: Math.max(50, 90 - (i * 10)),
      });
    }

    return {
      success: true,
      data: {
        historicalData: monthlyData,
        predictions,
        avgMonthlyDemand,
        methodology: 'Time-series projection based on 6-month historical average with growth factor',
      },
    };
  }

  async getByBloodType(months: number = 3) {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const requests = await this.prisma.bloodRequest.findMany({
      where: {
        requestedAt: { gte: sixMonthsAgo },
      },
      include: { items: true },
    });

    const bloodTypeDemand: Record<string, number> = {};
    for (const bt of Object.values(BloodType)) {
      bloodTypeDemand[bt] = 0;
    }

    for (const req of requests) {
      for (const item of req.items) {
        if (bloodTypeDemand[item.bloodType] !== undefined) {
          bloodTypeDemand[item.bloodType] += item.quantity;
        }
      }
    }

    const totalDemand = Object.values(bloodTypeDemand).reduce((a, b) => a + b, 0);

    const predictions: Array<{
      bloodType: string;
      historicalDemand: number;
      percentage: string;
      predictedNextMonth: number;
    }> = [];

    for (const [bt, demand] of Object.entries(bloodTypeDemand)) {
      const percentage = totalDemand > 0 ? ((demand / totalDemand) * 100).toFixed(1) : '0';
      const avgMonthly = Math.round(demand / 6);
      predictions.push({
        bloodType: bt,
        historicalDemand: demand,
        percentage: `${percentage}%`,
        predictedNextMonth: Math.round(avgMonthly * 1.02),
      });
    }

    return {
      success: true,
      data: {
        predictions,
        totalDemand,
        period: '6-month historical analysis',
      },
    };
  }

  async getByComponent(months: number = 3) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const requests = await this.prisma.bloodRequest.findMany({
      where: {
        requestedAt: { gte: sixMonthsAgo },
      },
      include: { items: true },
    });

    const componentDemand: Record<string, number> = {};
    for (const comp of Object.values(BloodComponent)) {
      componentDemand[comp] = 0;
    }

    for (const req of requests) {
      for (const item of req.items) {
        if (componentDemand[item.component] !== undefined) {
          componentDemand[item.component] += item.quantity;
        }
      }
    }

    const predictions: Array<{
      component: string;
      historicalDemand: number;
      predictedNextMonth: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    }> = [];

    for (const [comp, demand] of Object.entries(componentDemand)) {
      const avgMonthly = Math.round(demand / 6);
      const trend = demand > 0 ? 'stable' : 'stable';
      predictions.push({
        component: comp,
        historicalDemand: demand,
        predictedNextMonth: Math.round(avgMonthly * 1.02),
        trend,
      });
    }

    return {
      success: true,
      data: {
        predictions,
        period: '6-month historical analysis',
      },
    };
  }
}

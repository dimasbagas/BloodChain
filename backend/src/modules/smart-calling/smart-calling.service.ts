import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BloodType, Rhesus } from '@prisma/client';
import haversine from 'haversine-distance';

@Injectable()
export class SmartCallingService {
  constructor(private prisma: PrismaService) {}

  async callDonors(dto: {
    pmiId: string;
    bloodType: BloodType;
    rhesus?: Rhesus;
    radiusKm?: number;
  }) {
    const pmi = await this.prisma.pMI.findUnique({ where: { id: dto.pmiId } });
    if (!pmi) {
      throw new NotFoundException('PMI tidak ditemukan');
    }

    const radiusKm = dto.radiusKm || 10;

    const donors = await this.prisma.donor.findMany({
      where: {
        bloodType: dto.bloodType,
        ...(dto.rhesus ? { rhesus: dto.rhesus } : {}),
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });

    const eligibleDonors = donors
      .map((donor) => {
        const distance = haversine(
          { latitude: pmi.latitude, longitude: pmi.longitude },
          { latitude: donor.latitude!, longitude: donor.longitude! },
        ) / 1000;

        let daysSinceLast = Infinity;
        if (donor.lastDonationAt) {
          daysSinceLast = Math.floor((Date.now() - donor.lastDonationAt.getTime()) / (1000 * 60 * 60 * 24));
        }

        return { ...donor, distanceKm: Math.round(distance * 100) / 100, daysSinceLastDonation: daysSinceLast };
      })
      .filter((d) => d.distanceKm <= radiusKm && d.daysSinceLastDonation >= 75);

    if (eligibleDonors.length === 0) {
      return {
        success: true,
        message: 'Tidak ada donor yang memenuhi kriteria dalam radius yang ditentukan',
        data: { total: 0, donors: [] },
      };
    }

    const donorIds = eligibleDonors.map((d) => d.id);
    const call = await this.prisma.smartDonorCall.create({
      data: {
        pmiId: dto.pmiId,
        bloodType: dto.bloodType,
        rhesus: dto.rhesus || 'POSITIVE',
        donorIds,
        messageType: 'WHATSAPP',
        status: 'SENT',
      },
    });

    return {
      success: true,
      message: `${eligibleDonors.length} donor ditemukan dan panggilan berhasil dicatat`,
      data: {
        callId: call.id,
        total: eligibleDonors.length,
        donors: eligibleDonors.map((d) => ({
          id: d.id,
          fullName: d.user.fullName,
          phone: d.user.phone,
          bloodType: d.bloodType,
          rhesus: d.rhesus,
          distanceKm: d.distanceKm,
          lastDonationAt: d.lastDonationAt,
          daysSinceLastDonation: d.daysSinceLastDonation,
        })),
      },
    };
  }

  async getHistory(query: { page?: number; limit?: number; pmiId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.pmiId) where.pmiId = query.pmiId;

    const [calls, total] = await Promise.all([
      this.prisma.smartDonorCall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      }),
      this.prisma.smartDonorCall.count({ where }),
    ]);

    const pmis = await this.prisma.pMI.findMany({
      where: { id: { in: [...new Set(calls.map((c) => c.pmiId))] } },
      select: { id: true, name: true, city: true },
    });
    const pmiMap = new Map(pmis.map((p) => [p.id, p]));

    const data = calls.map((call) => ({
      ...call,
      pmi: pmiMap.get(call.pmiId) || null,
    }));

    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

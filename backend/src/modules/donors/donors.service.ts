import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BloodType, Rhesus } from '@prisma/client';

@Injectable()
export class DonorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; bloodType?: string; city?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { nik: { contains: query.search } },
      ];
    }
    if (query.bloodType) {
      where.bloodType = query.bloodType as BloodType;
    }
    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.donor.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true, photoUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.donor.count({ where }),
    ]);

    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const donor = await this.prisma.donor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, photoUrl: true } },
        donations: {
          orderBy: { donationDate: 'desc' },
          take: 10,
          include: { bloodBatch: true },
        },
      },
    });

    if (!donor) {
      throw new NotFoundException('Donor tidak ditemukan');
    }

    return { success: true, data: donor };
  }

  async create(dto: {
    userId: string;
    nik: string;
    bloodType: BloodType;
    rhesus: Rhesus;
    birthDate: string;
    weightKg: number;
    address: string;
    city: string;
    province: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
  }) {
    const existingNik = await this.prisma.donor.findUnique({ where: { nik: dto.nik } });
    if (existingNik) {
      throw new ConflictException('NIK sudah terdaftar sebagai donor');
    }

    const existingUser = await this.prisma.donor.findUnique({ where: { userId: dto.userId } });
    if (existingUser) {
      throw new ConflictException('User sudah terdaftar sebagai donor');
    }

    const donor = await this.prisma.donor.create({
      data: {
        userId: dto.userId,
        nik: dto.nik,
        bloodType: dto.bloodType,
        rhesus: dto.rhesus,
        birthDate: new Date(dto.birthDate),
        weightKg: dto.weightKg,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    if (dto.phone) {
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: { phone: dto.phone },
      });
    }

    return { success: true, message: 'Data donor berhasil disimpan', data: donor };
  }

  async update(id: string, dto: any) {
    const donor = await this.prisma.donor.findUnique({ where: { id } });
    if (!donor) {
      throw new NotFoundException('Donor tidak ditemukan');
    }

    if (dto.nik && dto.nik !== donor.nik) {
      const existingNik = await this.prisma.donor.findUnique({ where: { nik: dto.nik } });
      if (existingNik) {
        throw new ConflictException('NIK sudah digunakan donor lain');
      }
    }

    const updateData: any = {};
    if (dto.nik) updateData.nik = dto.nik;
    if (dto.bloodType) updateData.bloodType = dto.bloodType;
    if (dto.rhesus) updateData.rhesus = dto.rhesus;
    if (dto.birthDate) updateData.birthDate = new Date(dto.birthDate);
    if (dto.weightKg) updateData.weightKg = dto.weightKg;
    if (dto.address) updateData.address = dto.address;
    if (dto.city) updateData.city = dto.city;
    if (dto.province) updateData.province = dto.province;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.prisma.donor.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    return { success: true, message: 'Data donor berhasil diperbarui', data: updated };
  }

  async getHistory(id: string) {
    const donor = await this.prisma.donor.findUnique({ where: { id } });
    if (!donor) {
      throw new NotFoundException('Donor tidak ditemukan');
    }

    const donations = await this.prisma.donation.findMany({
      where: { donorId: id },
      include: {
        screening: true,
        eligibilityCheck: true,
        bloodBatch: true,
      },
      orderBy: { donationDate: 'desc' },
    });

    return {
      success: true,
      data: {
        donor: { id: donor.id, nik: donor.nik, bloodType: donor.bloodType, rhesus: donor.rhesus, totalDonations: donor.totalDonations, lastDonationAt: donor.lastDonationAt },
        donations,
      },
    };
  }
}

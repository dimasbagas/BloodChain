import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BloodType, Rhesus, Role, DonationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DonationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string, role?: Role) {
    const where: any = {};

    if (role === Role.DONOR && userId) {
      const donor = await this.prisma.donor.findUnique({
        where: { userId },
      });
      if (donor) {
        where.donorId = donor.id;
      } else {
        return {
          success: true,
          data: [],
        };
      }
    }

    const data = await this.prisma.donation.findMany({
      where,
      include: {
        donor: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        pmi: { select: { name: true, city: true } },
        hospital: { select: { name: true, city: true } },
        bloodBatch: true,
      },
      orderBy: { donationDate: 'desc' },
    });

    return {
      success: true,
      data,
    };
  }

  async create(dto: {
    donor_id?: string;
    nama: string;
    email: string;
    no_hp: string;
    golongan_darah: string;
    rhesus: string;
    tanggal_lahir: string;
    berat_badan: string;
    alamat: string;
    demam: boolean;
    batuk_pilek: boolean;
    obat_tertentu: boolean;
    tato_tindik: boolean;
    transfusi: boolean;
    hepatitis: boolean;
    hamil: boolean;
    operasi: boolean;
    bepergian: boolean;
    hospital_id?: string;
    pmi_id?: string;
  }) {
    const userEmail = dto.email.trim().toLowerCase();
    const donor = await this.prisma.$transaction(async (tx) => {
      let existingUser = await tx.user.findUnique({ where: { email: userEmail } });
      if (!existingUser) {
        const passwordHash = await bcrypt.hash('password123', 12);
        existingUser = await tx.user.create({
          data: {
            email: userEmail,
            passwordHash,
            role: Role.DONOR,
            fullName: dto.nama,
            phone: dto.no_hp,
          },
        });
      }

      let existingDonor = await tx.donor.findUnique({ where: { userId: existingUser.id } });
      if (!existingDonor) {
        const mappedRhesus = dto.rhesus === '-' ? Rhesus.NEGATIVE : Rhesus.POSITIVE;
        existingDonor = await tx.donor.create({
          data: {
            userId: existingUser.id,
            nik: `NIK-${existingUser.id.substring(0, 12).toUpperCase()}`,
            bloodType: (dto.golongan_darah || 'O') as BloodType,
            rhesus: mappedRhesus,
            birthDate: new Date(dto.tanggal_lahir || '1990-01-01'),
            weightKg: parseFloat(dto.berat_badan) || 60,
            address: dto.alamat || '',
            city: '',
            province: '',
          },
        });
      }

      return existingDonor;
    });

    let pmiId = dto.pmi_id;
    const hospitalId = dto.hospital_id || null;

    if (!pmiId) {
      const firstPmi = await this.prisma.pMI.findFirst();
      if (!firstPmi) {
        throw new NotFoundException('Tidak ada PMI terdaftar untuk melayani donasi');
      }
      pmiId = firstPmi.id;
    }

    const donation = await this.prisma.donation.create({
      data: {
        donorId: donor.id,
        pmiId: pmiId,
        hospitalId: hospitalId,
        status: DonationStatus.REGISTERED,
        healthQuestionnaire: {
          create: {
            donorId: donor.id,
            hasFever: dto.demam,
            hasCough: dto.batuk_pilek,
            hasWeightLoss: false,
            hasMedication: dto.obat_tertentu,
            hasTattoo: dto.tato_tindik,
            hasSurgery: dto.operasi,
            hasPregnancy: dto.hamil,
            hasTravelHistory: dto.bepergian,
            hasRiskyBehavior: dto.transfusi || dto.hepatitis,
          },
        },
      },
      include: {
        donor: { include: { user: true } },
        healthQuestionnaire: true,
      },
    });

    return {
      success: true,
      message: 'Donasi berhasil didaftarkan',
      data: donation,
    };
  }

  async getLocations() {
    const [pmis, hospitals] = await Promise.all([
      this.prisma.pMI.findMany({
        where: { isActive: true },
        select: { id: true, name: true, city: true, province: true, latitude: true, longitude: true },
      }),
      this.prisma.hospital.findMany({
        where: { isActive: true },
        select: { id: true, name: true, city: true, province: true, latitude: true, longitude: true },
      }),
    ]);

    return {
      success: true,
      data: {
        pmis,
        hospitals,
      },
    };
  }
}

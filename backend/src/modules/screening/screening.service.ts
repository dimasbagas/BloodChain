import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScreeningStatus, BloodComponent, Rhesus, BloodType } from '@prisma/client';

@Injectable()
export class ScreeningService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    donationId: string;
    hivStatus: ScreeningStatus;
    hepatitisBStatus: ScreeningStatus;
    hepatitisCStatus: ScreeningStatus;
    syphilisStatus: ScreeningStatus;
    notes?: string;
    testedBy?: string;
  }) {
    const donation = await this.prisma.donation.findUnique({
      where: { id: dto.donationId },
      include: { donor: true },
    });

    if (!donation) {
      throw new NotFoundException('Donasi tidak ditemukan');
    }

    if (donation.status !== 'ELIGIBLE' && donation.status !== 'SCREENING') {
      throw new BadRequestException('Donasi harus dalam status ELIGIBLE atau SCREENING untuk screening');
    }

    const existing = await this.prisma.bloodScreening.findUnique({
      where: { donationId: dto.donationId },
    });
    if (existing) {
      throw new BadRequestException('Screening untuk donasi ini sudah dilakukan');
    }

    const allPassed = dto.hivStatus === 'PASSED' && dto.hepatitisBStatus === 'PASSED' && dto.hepatitisCStatus === 'PASSED' && dto.syphilisStatus === 'PASSED';

    const anyFailed = dto.hivStatus === 'FAILED' || dto.hepatitisBStatus === 'FAILED' || dto.hepatitisCStatus === 'FAILED' || dto.syphilisStatus === 'FAILED';

    const overallStatus = allPassed ? 'PASSED' : anyFailed ? 'FAILED' : 'PENDING';

    const screening = await this.prisma.bloodScreening.create({
      data: {
        donationId: dto.donationId,
        hivStatus: dto.hivStatus,
        hepatitisBStatus: dto.hepatitisBStatus,
        hepatitisCStatus: dto.hepatitisCStatus,
        syphilisStatus: dto.syphilisStatus,
        overallStatus: overallStatus as ScreeningStatus,
        notes: dto.notes,
        testedBy: dto.testedBy,
      },
    });

    const donationStatus = overallStatus === 'PASSED' ? 'DONATED' : 'REJECTED';
    await this.prisma.donation.update({
      where: { id: dto.donationId },
      data: { status: donationStatus },
    });

    return {
      success: true,
      message: overallStatus === 'PASSED' ? 'Darah lolos screening dan siap masuk inventori' : 'Darah tidak lolos screening',
      data: screening,
    };
  }

  async getByDonationId(donationId: string) {
    const screening = await this.prisma.bloodScreening.findUnique({
      where: { donationId },
    });

    if (!screening) {
      throw new NotFoundException('Data screening tidak ditemukan');
    }

    return { success: true, data: screening };
  }

  async findAll() {
    const donations = await this.prisma.donation.findMany({
      include: {
        donor: {
          include: {
            user: { select: { fullName: true } }
          }
        },
        screening: true,
      },
      orderBy: { donationDate: 'desc' },
    });

    const mapped = donations.map((d) => {
      const scr = d.screening;
      
      const hiv = scr ? (scr.hivStatus === 'PASSED' ? 'negatif' : scr.hivStatus === 'FAILED' ? 'positif' : null) : null;
      const hepB = scr ? (scr.hepatitisBStatus === 'PASSED' ? 'negatif' : scr.hepatitisBStatus === 'FAILED' ? 'positif' : null) : null;
      const hepC = scr ? (scr.hepatitisCStatus === 'PASSED' ? 'negatif' : scr.hepatitisCStatus === 'FAILED' ? 'positif' : null) : null;
      const sifilis = scr ? (scr.syphilisStatus === 'PASSED' ? 'negatif' : scr.syphilisStatus === 'FAILED' ? 'positif' : null) : null;
      const status = scr 
        ? (scr.overallStatus === 'PASSED' ? 'approved' : scr.overallStatus === 'FAILED' ? 'rejected' : 'pending')
        : 'pending';

      return {
        id: scr?.id || `SCR-${d.id.substring(0, 8).toUpperCase()}`,
        donationId: d.id,
        donor_nama: d.donor?.user?.fullName || 'Donor',
        golongan_darah: d.donor?.bloodType || 'O',
        rhesus: d.donor?.rhesus === 'POSITIVE' ? '+' : '-',
        tanggal: d.donationDate || d.createdAt,
        hiv,
        hepatitis_b: hepB,
        hepatitis_c: hepC,
        sifilis,
        malaria: scr ? 'negatif' : null,
        status,
      };
    });

    return {
      success: true,
      data: mapped,
    };
  }

  async update(id: string, status: string, testedBy?: string) {
    let screening = await this.prisma.bloodScreening.findUnique({
      where: { id },
    });

    let donationId = screening?.donationId;

    if (!screening && id.startsWith('SCR-')) {
      const allDonations = await this.prisma.donation.findMany();
      const match = allDonations.find(d => `SCR-${d.id.substring(0, 8).toUpperCase()}` === id);
      if (match) {
        donationId = match.id;
      }
    }

    if (!donationId) {
      throw new NotFoundException('Screening atau Donasi tidak ditemukan');
    }

    const overallStatus = status === 'approved' ? 'PASSED' : 'FAILED';
    const testStatus = status === 'approved' ? 'PASSED' : 'FAILED';

    if (!screening) {
      screening = await this.prisma.bloodScreening.create({
        data: {
          donationId,
          hivStatus: testStatus as ScreeningStatus,
          hepatitisBStatus: testStatus as ScreeningStatus,
          hepatitisCStatus: testStatus as ScreeningStatus,
          syphilisStatus: testStatus as ScreeningStatus,
          overallStatus: overallStatus as ScreeningStatus,
          testedBy,
        },
      });
    } else {
      screening = await this.prisma.bloodScreening.update({
        where: { id: screening.id },
        data: {
          hivStatus: testStatus as ScreeningStatus,
          hepatitisBStatus: testStatus as ScreeningStatus,
          hepatitisCStatus: testStatus as ScreeningStatus,
          syphilisStatus: testStatus as ScreeningStatus,
          overallStatus: overallStatus as ScreeningStatus,
          testedBy,
        },
      });
    }

    const donationStatus = overallStatus === 'PASSED' ? 'DONATED' : 'REJECTED';
    await this.prisma.donation.update({
      where: { id: donationId },
      data: { status: donationStatus },
    });

    if (overallStatus === 'PASSED') {
      const donation = await this.prisma.donation.findUnique({
        where: { id: donationId },
        include: { donor: true },
      });
      if (donation) {
        let batch = await this.prisma.bloodBatch.findUnique({
          where: { donationId },
        });
        if (!batch) {
          batch = await this.prisma.bloodBatch.create({
            data: {
              donationId,
              pmiId: donation.pmiId,
              batchCode: `BTC-${Date.now().toString(36).toUpperCase()}`,
              barcode: `BC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              bloodType: donation.donor.bloodType,
              rhesus: donation.donor.rhesus,
              component: 'PRC',
              volumeMl: donation.donor.weightKg ? donation.donor.weightKg * 5 : 350,
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'AVAILABLE',
            },
          });
        }

        const inv = await this.prisma.bloodInventory.findFirst({
          where: { batchId: batch.id },
        });
        if (!inv) {
          await this.prisma.bloodInventory.create({
            data: {
              batchId: batch.id,
              pmiId: donation.pmiId,
              status: 'AVAILABLE',
            },
          });
        }
      }
    }

    return {
      success: true,
      message: 'Status screening berhasil diperbarui',
      data: screening,
    };
  }
}

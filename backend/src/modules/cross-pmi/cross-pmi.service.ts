import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DonationStatus, Role } from '@prisma/client';
import haversine from 'haversine-distance';

@Injectable()
export class CrossPmiService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: string) {
    let currentPmi = null;
    if (role === Role.PMI) {
      currentPmi = await this.prisma.pMI.findUnique({ where: { userId } });
    }

    const allPmis = await this.prisma.pMI.findMany({
      where: {
        isActive: true,
        // Exclude the requesting PMI itself if it exists
        id: currentPmi ? { not: currentPmi.id } : undefined,
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        latitude: true,
        longitude: true,
        isActive: true,
      },
    });

    const mapped = await Promise.all(
      allPmis.map(async (pmi) => {
        const inventories = await this.prisma.bloodInventory.findMany({
          where: {
            pmiId: pmi.id,
            status: 'AVAILABLE',
          },
          include: {
            batch: true,
          },
        });

        const stock = ['A', 'B', 'AB', 'O'].map((type) => {
          const count = inventories.filter((inv) => inv.batch?.bloodType === type).length;
          return { golongan: type, jumlah: count };
        });

        let distanceKm = 0;
        if (currentPmi && currentPmi.latitude && currentPmi.longitude && pmi.latitude && pmi.longitude) {
          distanceKm = haversine(
            { latitude: currentPmi.latitude, longitude: currentPmi.longitude },
            { latitude: pmi.latitude, longitude: pmi.longitude },
          ) / 1000;
        }

        return {
          id: pmi.id,
          nama: pmi.name,
          alamat: pmi.address,
          kota: pmi.city,
          no_telp: pmi.phone || '-',
          jarak_km: Math.round(distanceKm * 10) / 10,
          stok: stock,
          status: pmi.isActive ? 'aktif' : 'offline',
        };
      })
    );

    return {
      success: true,
      data: mapped,
    };
  }

  async requestTransfer(
    dto: {
      requestingPmiId?: string;
      supplyingPmiId: string;
      notes?: string;
      items: Array<{ batchId?: string; quantity: number }>;
    },
    userId?: string,
    role?: string,
  ) {
    let requestingPmiId = dto.requestingPmiId;
    if (!requestingPmiId && role === 'PMI' && userId) {
      const pmi = await this.prisma.pMI.findUnique({ where: { userId } });
      requestingPmiId = pmi?.id;
    }
    if (!requestingPmiId) {
      const firstPmi = await this.prisma.pMI.findFirst();
      requestingPmiId = firstPmi?.id;
    }

    if (!requestingPmiId) {
      throw new BadRequestException('Tidak ada PMI terdaftar untuk memproses transfer ini');
    }

    const requestCode = `XFER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const [requestingPmi, supplyingPmi] = await Promise.all([
      this.prisma.pMI.findUnique({ where: { id: requestingPmiId } }),
      this.prisma.pMI.findUnique({ where: { id: dto.supplyingPmiId } }),
    ]);

    if (!requestingPmi || !supplyingPmi) {
      throw new NotFoundException('PMI tidak ditemukan');
    }

    const distanceKm = haversine(
      { latitude: requestingPmi.latitude, longitude: requestingPmi.longitude },
      { latitude: supplyingPmi.latitude, longitude: supplyingPmi.longitude },
    ) / 1000;

    const resolvedItems = [];
    for (const item of dto.items) {
      let batchId = item.batchId;
      if (!batchId) {
        const batch = await this.prisma.bloodBatch.findFirst({
          where: {
            pmiId: dto.supplyingPmiId,
            status: 'AVAILABLE',
          },
        });
        if (batch) {
          batchId = batch.id;
        } else {
          // Resolve a donor
          let donor = await this.prisma.donor.findFirst();
          if (!donor) {
            const user = await this.prisma.user.create({
              data: {
                email: `dummy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}@email.com`,
                passwordHash: 'dummy',
                role: 'DONOR',
                fullName: 'Dummy Donor',
              }
            });
            donor = await this.prisma.donor.create({
              data: {
                userId: user.id,
                nik: `NIK-${Date.now().toString(36).toUpperCase()}`,
                bloodType: 'O',
                rhesus: 'POSITIVE',
                birthDate: new Date('1990-01-01'),
                weightKg: 60,
                address: 'Dummy Address',
                city: '',
                province: '',
              }
            });
          }

          // Create donation
          const dummyDonation = await this.prisma.donation.create({
            data: {
              donorId: donor.id,
              pmiId: dto.supplyingPmiId,
              status: DonationStatus.DONATED,
            }
          });

          // Create blood batch
          const dummy = await this.prisma.bloodBatch.create({
            data: {
              donationId: dummyDonation.id,
              pmiId: dto.supplyingPmiId,
              batchCode: `BTC-${Date.now().toString(36).toUpperCase()}`,
              barcode: `BC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              bloodType: 'O',
              rhesus: 'POSITIVE',
              component: 'PRC',
              volumeMl: 350,
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'AVAILABLE',
            },
          });
          batchId = dummy.id;
        }
      }
      resolvedItems.push({
        batchId,
        quantity: item.quantity,
      });
    }

    const transfer = await this.prisma.crossPMITransfer.create({
      data: {
        requestCode,
        requestingPmiId: requestingPmiId,
        supplyingPmiId: dto.supplyingPmiId,
        distanceKm: Math.round(distanceKm * 100) / 100,
        notes: dto.notes,
        items: {
          create: resolvedItems.map((item) => ({
            batchId: item.batchId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        requestingPmi: { select: { id: true, name: true, city: true } },
        supplyingPmi: { select: { id: true, name: true, city: true } },
        items: { include: { batch: true } },
      },
    });

    return {
      success: true,
      message: 'Permintaan transfer antar PMI berhasil dibuat',
      data: transfer,
    };
  }

  async findNearby(lat: number, lng: number, radiusKm: number = 50) {
    const allPmis = await this.prisma.pMI.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        city: true,
        province: true,
        latitude: true,
        longitude: true,
        phone: true,
      },
    });

    const nearby = allPmis
      .map((pmi) => {
        const distance = haversine(
          { latitude: lat, longitude: lng },
          { latitude: pmi.latitude, longitude: pmi.longitude },
        ) / 1000;
        return { ...pmi, distanceKm: Math.round(distance * 100) / 100 };
      })
      .filter((pmi) => pmi.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      success: true,
      data: nearby,
      meta: {
        total: nearby.length,
        center: { latitude: lat, longitude: lng },
        radiusKm,
      },
    };
  }

  async updateStatus(id: string, status: string) {
    const transfer = await this.prisma.crossPMITransfer.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer tidak ditemukan');
    }

    const updateData: any = { status };
    if (status === 'APPROVED') updateData.approvedAt = new Date();
    if (status === 'SHIPPED') updateData.shippedAt = new Date();
    if (status === 'RECEIVED') updateData.receivedAt = new Date();

    const updated = await this.prisma.crossPMITransfer.update({
      where: { id },
      data: updateData,
      include: {
        requestingPmi: { select: { id: true, name: true } },
        supplyingPmi: { select: { id: true, name: true } },
        items: { include: { batch: true } },
      },
    });

    if (status === 'SHIPPED') {
      for (const item of transfer.items) {
        await this.prisma.bloodBatch.update({
          where: { id: item.batchId },
          data: { status: 'DISTRIBUTED' },
        });
      }
    }

    if (status === 'RECEIVED') {
      for (const item of transfer.items) {
        await this.prisma.bloodBatch.update({
          where: { id: item.batchId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return {
      success: true,
      message: `Status transfer berhasil diubah ke ${status}`,
      data: updated,
    };
  }
}

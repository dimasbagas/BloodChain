import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EligibilityService {
  constructor(private prisma: PrismaService) {}

  async check(dto: {
    donationId: string;
    donorId: string;
    systolicBP: number;
    diastolicBP: number;
    hemoglobin: number;
    checkedBy?: string;
  }) {
    const donor = await this.prisma.donor.findUnique({ where: { id: dto.donorId } });
    if (!donor) {
      throw new NotFoundException('Donor tidak ditemukan');
    }

    const donation = await this.prisma.donation.findUnique({ where: { id: dto.donationId } });
    if (!donation) {
      throw new NotFoundException('Donasi tidak ditemukan');
    }

    const age = this.calculateAge(donor.birthDate);
    const isAgeEligible = age >= 17 && age <= 60;

    const isWeightEligible = donor.weightKg >= 45;

    const isBloodPressureOk = dto.systolicBP >= 90 && dto.systolicBP <= 160 && dto.diastolicBP >= 60 && dto.diastolicBP <= 100;

    const isHemoglobinOk = dto.hemoglobin >= 12.5 && dto.hemoglobin <= 17.0;

    let daysSinceLastDonation: number | null = null;
    let isRetentionOk = true;
    if (donor.lastDonationAt) {
      daysSinceLastDonation = Math.floor((Date.now() - donor.lastDonationAt.getTime()) / (1000 * 60 * 60 * 24));
      isRetentionOk = daysSinceLastDonation >= 75;
    }

    const reasons: string[] = [];
    if (!isAgeEligible) reasons.push(`Usia ${age} tahun tidak memenuhi syarat (17-60 tahun)`);
    if (!isWeightEligible) reasons.push(`Berat badan ${donor.weightKg} kg tidak memenuhi syarat (>= 45 kg)`);
    if (!isBloodPressureOk) reasons.push(`Tekanan darah ${dto.systolicBP}/${dto.diastolicBP} mmHg tidak memenuhi syarat (90-160/60-100)`);
    if (!isHemoglobinOk) reasons.push(`Hemoglobin ${dto.hemoglobin} g/dL tidak memenuhi syarat (12.5-17.0 g/dL)`);
    if (!isRetentionOk) reasons.push(`Masa retensi ${daysSinceLastDonation} hari belum mencukupi (>= 75 hari)`);

    const isEligible = isAgeEligible && isWeightEligible && isBloodPressureOk && isHemoglobinOk && isRetentionOk;

    const result = await this.prisma.eligibilityCheck.create({
      data: {
        donorId: dto.donorId,
        donationId: dto.donationId,
        age,
        isAgeEligible,
        weightKg: donor.weightKg,
        isWeightEligible,
        systolicBP: dto.systolicBP,
        diastolicBP: dto.diastolicBP,
        isBloodPressureOk,
        hemoglobin: dto.hemoglobin,
        isHemoglobinOk,
        daysSinceLastDonation,
        isRetentionOk,
        isEligible,
        rejectionReason: reasons.length > 0 ? reasons.join('; ') : null,
        checkedBy: dto.checkedBy,
      },
    });

    await this.prisma.donation.update({
      where: { id: dto.donationId },
      data: { status: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE' },
    });

    return {
      success: true,
      message: isEligible ? 'Donor memenuhi syarat' : 'Donor tidak memenuhi syarat',
      data: {
        id: result.id,
        isEligible,
        age,
        weightKg: donor.weightKg,
        systolicBP: dto.systolicBP,
        diastolicBP: dto.diastolicBP,
        hemoglobin: dto.hemoglobin,
        daysSinceLastDonation,
        details: {
          isAgeEligible,
          isWeightEligible,
          isBloodPressureOk,
          isHemoglobinOk,
          isRetentionOk,
        },
        rejectionReason: result.rejectionReason,
      },
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

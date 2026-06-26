import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role,
          fullName: dto.fullName,
          phone: dto.phone,
          photoUrl: dto.photoUrl,
        },
      });

      if (dto.role === 'DONOR') {
        await tx.donor.create({
          data: {
            userId: createdUser.id,
            nik: `NIK-${createdUser.id.substring(0, 12).toUpperCase()}`,
            bloodType: dto.bloodType || 'O',
            rhesus: dto.rhesus || 'POSITIVE',
            birthDate: new Date('1990-01-01'),
            weightKg: 60,
            address: '',
            city: '',
            province: '',
          },
        });
      } else if (dto.role === 'PMI') {
        await tx.pMI.create({
          data: {
            userId: createdUser.id,
            name: dto.fullName,
            code: `PMI-${createdUser.id.substring(0, 8).toUpperCase()}`,
            address: '',
            city: '',
            province: '',
            latitude: 0.0,
            longitude: 0.0,
            phone: dto.phone || '',
          },
        });
      } else if (dto.role === 'HOSPITAL') {
        await tx.hospital.create({
          data: {
            userId: createdUser.id,
            name: dto.fullName,
            code: `HOSP-${createdUser.id.substring(0, 8).toUpperCase()}`,
            address: '',
            city: '',
            province: '',
            latitude: 0.0,
            longitude: 0.0,
            phone: dto.phone || '',
          },
        });
      }

      return createdUser;
    });

    const userSelect = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      photoUrl: user.photoUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    return {
      success: true,
      message: 'Registrasi berhasil',
      data: userSelect,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        ...tokens,
      },
    };
  }

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        phone: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    return {
      success: true,
      data: user,
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User tidak valid');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      success: true,
      message: 'Token berhasil diperbarui',
      data: tokens,
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}

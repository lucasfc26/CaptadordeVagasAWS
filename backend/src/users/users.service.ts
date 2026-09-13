import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async create(data: RegisterDto) {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Este email já está cadastrado');
    }

    const passwordHash = await argon2.hash(data.password);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        settings: { create: { whatsappEnabled: true } },
      },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    await this.findByIdOrThrow(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        timezone: data.timezone,
      },
    });
  }

  async updatePassword(userId: string, data: UpdatePasswordDto) {
    const user = await this.findByIdOrThrow(userId);

    const valid = await argon2.verify(user.passwordHash, data.currentPassword);
    if (!valid) {
      throw new ConflictException('Senha atual incorreta');
    }

    const passwordHash = await argon2.hash(data.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.findByIdOrThrow(userId);
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const valid = await argon2.verify(user.passwordHash, password);
    return valid ? user : null;
  }

  getSettings(userId: string) {
    return this.prisma.userSettings.findUniqueOrThrow({ where: { userId } });
  }

  async updateSettings(userId: string, data: UpdateSettingsDto) {
    await this.findByIdOrThrow(userId);
    const { timezone, ...settingsData } = data;

    if (timezone) {
      await this.prisma.user.update({ where: { id: userId }, data: { timezone } });
    }

    return this.prisma.userSettings.update({
      where: { userId },
      data: settingsData,
    });
  }
}

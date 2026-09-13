import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DeliveryStatus,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { paginate } from '../common/utils/paginate';
import { NotificationFiltersDto } from './dto/notification-filters.dto';
import { WhatsappNotificationChannel } from './channels/whatsapp-notification.channel';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappChannel: WhatsappNotificationChannel,
  ) {}

  async notifyJobWhatsapp(userId: string, jobId: string) {
    const [user, job] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.job.findFirst({
        where: { id: jobId, jobSearches: { some: { search: { userId } } } },
      }),
    ]);

    if (!job) {
      throw new NotFoundException('Vaga não encontrada');
    }
    if (!user?.phone) {
      throw new BadRequestException(
        'Salve seu WhatsApp em Configurações > Perfil antes de enviar.',
      );
    }

    const title = `Nova vaga: ${job.title}`;
    const location = [job.city, job.state].filter(Boolean).join(', ');
    const message = [job.company, location, job.salary, job.schedule].filter(Boolean).join(' · ');

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.NEW_JOB,
        title,
        message,
        channel: NotificationChannel.WHATSAPP,
        jobId: job.id,
        deliveries: { create: [{ channel: NotificationChannel.WHATSAPP }] },
      },
      include: { deliveries: true },
    });

    const delivery = notification.deliveries[0];

    try {
      await this.whatsappChannel.send({
        to: user.phone,
        title,
        message,
        jobUrl: job.url,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.FAILED, errorMessage, attempts: { increment: 1 } },
      });
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });
      throw new BadRequestException(errorMessage);
    }

    await this.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: DeliveryStatus.SENT, sentAt: new Date(), attempts: { increment: 1 } },
    });
    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { status: NotificationStatus.SENT, sentAt: new Date() },
    });

    return { sent: true, notificationId: notification.id };
  }

  async findAllForUser(userId: string, filters: NotificationFiltersDto) {
    const conditions: Prisma.NotificationWhereInput[] = [{ userId }];

    if (filters.type) conditions.push({ type: filters.type });
    if (filters.status) conditions.push({ status: filters.status });
    if (filters.channel) conditions.push({ channel: filters.channel });
    if (filters.read === 'true') conditions.push({ readAt: { not: null } });
    if (filters.read === 'false') conditions.push({ readAt: null });

    const where: Prisma.NotificationWhereInput = { AND: conditions };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(notifications, total, filters.page, filters.limit);
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });
  }

  async remove(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificação não encontrada');
    }
    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true, id };
  }

  async removeMany(userId: string, ids: string[]) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, id: { in: [...new Set(ids.filter(Boolean))] } },
    });
    return { deleted: result.count };
  }

  async removeAllForUser(userId: string) {
    const result = await this.prisma.notification.deleteMany({ where: { userId } });
    return { deleted: result.count };
  }
}

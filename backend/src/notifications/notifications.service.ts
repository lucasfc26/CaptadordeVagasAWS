import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { paginate } from '../common/utils/paginate';
import { NotificationFiltersDto } from './dto/notification-filters.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
}

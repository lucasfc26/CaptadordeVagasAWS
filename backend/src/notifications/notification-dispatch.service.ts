import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsQueueService } from '../queues/notifications-queue.service';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  jobId?: string;
  searchId?: string;
}

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsQueue: NotificationsQueueService,
  ) {}

  async create(params: CreateNotificationParams) {
    const channels = params.channels.length ? params.channels : [NotificationChannel.EMAIL];

    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        channel: channels[0],
        jobId: params.jobId,
        searchId: params.searchId,
        deliveries: {
          create: channels.map((channel) => ({ channel })),
        },
      },
    });

    await this.notificationsQueue.enqueueSend(notification.id);
    return notification;
  }
}

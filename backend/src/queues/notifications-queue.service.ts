import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATIONS_JOB_SEND, NOTIFICATIONS_QUEUE } from './queue.constants';

@Injectable()
export class NotificationsQueueService {
  constructor(@InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue) {}

  async enqueueSend(notificationId: string) {
    await this.queue.add(NOTIFICATIONS_JOB_SEND, { notificationId });
  }
}

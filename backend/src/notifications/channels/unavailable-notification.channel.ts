import { NotificationChannel } from '@prisma/client';
import { NotificationChannelSender, NotificationPayload } from './notification-channel.interface';

export class UnavailableNotificationChannel implements NotificationChannelSender {
  constructor(readonly channel: NotificationChannel) {}

  send(_payload: NotificationPayload): Promise<void> {
    return Promise.reject(
      new Error(`Canal de notificação "${this.channel}" ainda não implementado`),
    );
  }
}

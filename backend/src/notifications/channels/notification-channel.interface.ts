import { NotificationChannel } from '@prisma/client';

export interface NotificationPayload {
  to: string;
  title: string;
  message: string;
  jobUrl?: string;
}

export const NOTIFICATION_CHANNEL_SENDER = 'NOTIFICATION_CHANNEL_SENDER';

export interface NotificationChannelSender {
  readonly channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<void>;
}

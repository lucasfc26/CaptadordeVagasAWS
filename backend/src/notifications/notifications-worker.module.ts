import { Module } from '@nestjs/common';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsProcessor } from './notifications.processor';
import { EmailNotificationChannel } from './channels/email-notification.channel';
import { WhatsappNotificationChannel } from './channels/whatsapp-notification.channel';

@Module({
  providers: [
    NotificationDispatchService,
    NotificationsProcessor,
    EmailNotificationChannel,
    WhatsappNotificationChannel,
  ],
  exports: [NotificationDispatchService],
})
export class NotificationsWorkerModule {}

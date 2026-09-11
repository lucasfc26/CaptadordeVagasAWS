import { Module } from '@nestjs/common';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsProcessor } from './notifications.processor';
import { EmailNotificationChannel } from './channels/email-notification.channel';

@Module({
  providers: [NotificationDispatchService, NotificationsProcessor, EmailNotificationChannel],
  exports: [NotificationDispatchService],
})
export class NotificationsWorkerModule {}

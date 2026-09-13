import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WhatsappNotificationChannel } from './channels/whatsapp-notification.channel';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WhatsappNotificationChannel],
  exports: [NotificationsService],
})
export class NotificationsModule {}

import { Global, Module } from '@nestjs/common';
import { MonitoringQueueService } from './monitoring-queue.service';
import { NotificationsQueueService } from './notifications-queue.service';

@Global()
@Module({
  providers: [MonitoringQueueService, NotificationsQueueService],
  exports: [MonitoringQueueService, NotificationsQueueService],
})
export class QueueServicesModule {}

import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueuesModule } from './queues/queues.module';
import { QueueServicesModule } from './queues/queue-services.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { NotificationsWorkerModule } from './notifications/notifications-worker.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    QueuesModule,
    QueueServicesModule,
    NotificationsWorkerModule,
    MonitoringModule,
  ],
})
export class WorkerModule {}

import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '../config/app-config.service';
import { MONITORING_QUEUE, NOTIFICATIONS_QUEUE, WAREHOUSE_MONITORING_QUEUE } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: {
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword || undefined,
          db: config.redisDb,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 500 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: MONITORING_QUEUE },
      { name: WAREHOUSE_MONITORING_QUEUE },
      { name: NOTIFICATIONS_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}

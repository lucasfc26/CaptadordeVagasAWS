import { Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { NotificationsWorkerModule } from '../notifications/notifications-worker.module';
import { AmazonJobsAdapter } from './adapters/amazon-jobs.adapter';
import { AmazonWarehouseAdapter } from './adapters/amazon-warehouse.adapter';
import { MockJobsAdapter } from './adapters/mock-jobs.adapter';
import { JOB_SOURCE_ADAPTER, JobSourceAdapter } from './interfaces/job-source-adapter.interface';
import { MonitoringService } from './monitoring.service';
import { MonitoringProcessor } from './monitoring.processor';
import { WarehouseMonitoringProcessor } from './warehouse-monitoring.processor';

@Module({
  imports: [NotificationsWorkerModule],
  providers: [
    AmazonJobsAdapter,
    AmazonWarehouseAdapter,
    MockJobsAdapter,
    {
      provide: JOB_SOURCE_ADAPTER,
      inject: [AppConfigService, AmazonJobsAdapter, MockJobsAdapter],
      useFactory: (
        config: AppConfigService,
        amazon: AmazonJobsAdapter,
        mock: MockJobsAdapter,
      ): JobSourceAdapter => (config.jobSource === 'mock' ? mock : amazon),
    },
    MonitoringService,
    MonitoringProcessor,
    WarehouseMonitoringProcessor,
  ],
  exports: [MonitoringService],
})
export class MonitoringModule {}

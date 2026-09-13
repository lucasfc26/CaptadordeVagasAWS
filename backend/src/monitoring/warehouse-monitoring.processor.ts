import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WAREHOUSE_MONITORING_QUEUE } from '../queues/queue.constants';
import { MonitoringService } from './monitoring.service';

interface ExecuteSearchJobData {
  searchId: string;
}

@Processor(WAREHOUSE_MONITORING_QUEUE, {
  concurrency: 1,
  lockDuration: 300_000,
})
export class WarehouseMonitoringProcessor extends WorkerHost {
  private readonly logger = new Logger(WarehouseMonitoringProcessor.name);

  constructor(private readonly monitoringService: MonitoringService) {
    super();
  }

  async process(job: Job<ExecuteSearchJobData>): Promise<void> {
    this.logger.log(`Fila Warehouse: iniciando busca ${job.data.searchId}`);
    try {
      await this.monitoringService.executeSearch(job.data.searchId);
    } finally {
      this.logger.log(`Fila Warehouse: busca ${job.data.searchId} encerrada`);
    }
  }
}

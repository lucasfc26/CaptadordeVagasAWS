import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MONITORING_QUEUE } from '../queues/queue.constants';
import { MonitoringService } from './monitoring.service';

interface ExecuteSearchJobData {
  searchId: string;
}

@Processor(MONITORING_QUEUE, {
  concurrency: Number(process.env.MONITORING_CONCURRENCY) || 3,
})
export class MonitoringProcessor extends WorkerHost {
  private readonly logger = new Logger(MonitoringProcessor.name);

  constructor(private readonly monitoringService: MonitoringService) {
    super();
  }

  async process(job: Job<ExecuteSearchJobData>): Promise<void> {
    this.logger.debug(`Executando monitoramento para busca ${job.data.searchId}`);
    await this.monitoringService.executeSearch(job.data.searchId);
  }
}

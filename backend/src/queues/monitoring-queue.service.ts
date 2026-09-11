import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MONITORING_JOB_EXECUTE_SEARCH, MONITORING_QUEUE } from './queue.constants';

@Injectable()
export class MonitoringQueueService {
  private readonly logger = new Logger(MonitoringQueueService.name);

  constructor(@InjectQueue(MONITORING_QUEUE) private readonly queue: Queue) {}

  async scheduleSearch(searchId: string, delayMs = 0) {
    await this.queue.add(
      MONITORING_JOB_EXECUTE_SEARCH,
      { searchId },
      {
        jobId: `search-${searchId}`,
        delay: Math.max(0, delayMs),
      },
    );
  }

  async cancelSearch(searchId: string) {
    try {
      const job = await this.queue.getJob(`search-${searchId}`);
      if (job) {
        await job.remove();
      }
    } catch (error) {
      this.logger.warn(`Não foi possível cancelar o job da busca ${searchId}: ${String(error)}`);
    }
  }
}

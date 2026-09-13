import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { SearchSourceType } from '@prisma/client';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import {
  MONITORING_JOB_EXECUTE_SEARCH,
  MONITORING_QUEUE,
  WAREHOUSE_MONITORING_QUEUE,
} from './queue.constants';

@Injectable()
export class MonitoringQueueService {
  private readonly logger = new Logger(MonitoringQueueService.name);

  constructor(
    @InjectQueue(MONITORING_QUEUE) private readonly queue: Queue,
    @InjectQueue(WAREHOUSE_MONITORING_QUEUE) private readonly warehouseQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async scheduleSearch(searchId: string, delayMs = 0) {
    const search = await this.prisma.search.findUnique({
      where: { id: searchId },
      select: { sourceType: true },
    });
    const queue = this.queueFor(search?.sourceType);
    const runId = this.jobId(searchId);
    const nextId = this.nextJobId(searchId);
    const runJob = await this.getFromQueues(runId);
    const nextJob = await this.getFromQueues(nextId);
    const runState = runJob ? await runJob.getState() : null;
    const nextState = nextJob ? await nextJob.getState() : null;

    if (delayMs <= 0) {
      if (runState === 'active' || nextState === 'active') {
        this.logger.debug(`Busca ${searchId} já está em execução`);
        return;
      }
      await this.removeJob(runJob);
      await this.removeJob(nextJob);
      await queue.add(
        MONITORING_JOB_EXECUTE_SEARCH,
        { searchId },
        { jobId: runId, delay: 0 },
      );
      return;
    }

    const targetId = runState === 'active' ? nextId : runId;
    if (runState === 'active') {
      if (nextJob && nextState !== 'active') await this.removeJob(nextJob);
    } else {
      await this.removeJob(runJob);
      if (nextState !== 'active') await this.removeJob(nextJob);
    }

    await queue.add(
      MONITORING_JOB_EXECUTE_SEARCH,
      { searchId },
      { jobId: targetId, delay: Math.max(0, delayMs) },
    );
    this.logger.debug(`Próxima busca ${searchId} em ${Math.round(delayMs / 1000)}s (${targetId})`);
  }

  async cancelSearch(searchId: string) {
    await this.removeIfIdle(await this.getFromQueues(this.jobId(searchId)));
    await this.removeIfIdle(await this.getFromQueues(this.nextJobId(searchId)));
  }

  private queueFor(sourceType?: SearchSourceType | null) {
    return sourceType === SearchSourceType.AMAZON_WAREHOUSE ? this.warehouseQueue : this.queue;
  }

  private jobId(searchId: string) {
    return `search-${searchId}`;
  }

  private nextJobId(searchId: string) {
    return `search-${searchId}-next`;
  }

  private async getFromQueues(id: string): Promise<Job | undefined> {
    return (await this.queue.getJob(id)) ?? (await this.warehouseQueue.getJob(id));
  }

  private async removeJob(job?: Job) {
    if (!job) return;
    try {
      await job.remove();
    } catch {
      return;
    }
  }

  private async removeIfIdle(job?: Job) {
    if (!job) return;
    try {
      const state = await job.getState();
      if (state === 'active') return;
      await job.remove();
    } catch (error) {
      this.logger.warn(`Não foi possível cancelar o job: ${String(error)}`);
    }
  }
}

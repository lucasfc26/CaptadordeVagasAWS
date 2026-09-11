import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExecutionStatus, NotificationType, SearchStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { MonitoringQueueService } from '../queues/monitoring-queue.service';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service';
import { JOB_SOURCE_ADAPTER, JobSourceAdapter } from './interfaces/job-source-adapter.interface';
import { normalizeJob } from './normalizers/job.normalizer';

const STALE_MISSED_CHECKS = 2;

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(JOB_SOURCE_ADAPTER) private readonly adapter: JobSourceAdapter,
    private readonly notificationDispatch: NotificationDispatchService,
    private readonly monitoringQueue: MonitoringQueueService,
  ) {}

  async executeSearch(searchId: string): Promise<void> {
    const search = await this.prisma.search.findUnique({
      where: { id: searchId },
      include: { keywords: true, locations: true },
    });

    if (!search || search.status === SearchStatus.PAUSED) {
      return;
    }

    const execution = await this.prisma.monitoringExecution.create({
      data: { searchId, status: ExecutionStatus.RUNNING },
    });

    try {
      const externalJobs = await this.adapter.search({
        keywords: search.keywords.map((k) => k.value),
        locations: search.locations.map((l) => ({
          city: l.city,
          state: l.state,
          country: l.country,
        })),
        radiusMiles: search.radiusMiles,
      });

      const normalized = externalJobs.map(normalizeJob);
      const newJobs: { id: string; title: string; city: string; state: string }[] = [];

      for (const nj of normalized) {
        const key = { source_externalId: { source: nj.source, externalId: nj.externalId } };
        const existing = await this.prisma.job.findUnique({ where: key });

        const job = await this.prisma.job.upsert({
          where: key,
          create: { ...nj, firstSeenAt: new Date(), lastSeenAt: new Date(), isActive: true },
          update: { ...nj, lastSeenAt: new Date(), isActive: true },
        });

        await this.prisma.jobSearch.upsert({
          where: { jobId_searchId: { jobId: job.id, searchId } },
          create: { jobId: job.id, searchId },
          update: {},
        });

        if (!existing) {
          newJobs.push(job);
        }
      }

      await this.deactivateStaleJobs(searchId, search.frequencyMinutes);

      await this.prisma.monitoringExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.SUCCESS,
          finishedAt: new Date(),
          jobsFound: normalized.length,
          newJobs: newJobs.length,
        },
      });

      await this.prisma.search.updateMany({
        where: { id: searchId, status: { not: SearchStatus.PAUSED } },
        data: { lastCheckedAt: new Date(), status: SearchStatus.ACTIVE },
      });

      for (const job of newJobs) {
        await this.notificationDispatch.create({
          userId: search.userId,
          type: NotificationType.NEW_JOB,
          title: 'Nova vaga encontrada',
          message: `${job.title} — ${job.city}, ${job.state}`,
          channels: search.notificationChannels,
          jobId: job.id,
          searchId: search.id,
        });
      }

      this.logger.log(
        `Busca ${searchId}: ${normalized.length} vagas encontradas, ${newJobs.length} novas`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha na busca ${searchId}: ${message}`);

      await this.prisma.monitoringExecution.update({
        where: { id: execution.id },
        data: { status: ExecutionStatus.FAILED, finishedAt: new Date(), errorMessage: message },
      });

      await this.prisma.search.updateMany({
        where: { id: searchId, status: { not: SearchStatus.PAUSED } },
        data: { lastCheckedAt: new Date(), status: SearchStatus.ERROR },
      });
    } finally {
      await this.scheduleNext(searchId, search.frequencyMinutes);
    }
  }

  private async deactivateStaleJobs(searchId: string, frequencyMinutes: number) {
    const cutoff = new Date(Date.now() - frequencyMinutes * 60_000 * STALE_MISSED_CHECKS);
    await this.prisma.job.updateMany({
      where: {
        jobSearches: { some: { searchId } },
        lastSeenAt: { lt: cutoff },
        isActive: true,
      },
      data: { isActive: false },
    });
  }

  private async scheduleNext(searchId: string, frequencyMinutes: number) {
    const current = await this.prisma.search.findUnique({
      where: { id: searchId },
      select: { status: true },
    });

    if (!current || current.status === SearchStatus.PAUSED) {
      return;
    }

    const delayMs = frequencyMinutes * 60_000;
    await this.prisma.search.update({
      where: { id: searchId },
      data: { nextCheckAt: new Date(Date.now() + delayMs) },
    });
    await this.monitoringQueue.scheduleSearch(searchId, delayMs);
  }
}

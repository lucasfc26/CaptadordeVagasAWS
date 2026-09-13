import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExecutionStatus, NotificationType, SearchSourceType, SearchStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { MonitoringQueueService } from '../queues/monitoring-queue.service';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service';
import { AmazonWarehouseAdapter } from './adapters/amazon-warehouse.adapter';
import {
  JOB_SOURCE_ADAPTER,
  JobSourceAdapter,
  WarehouseSearchFilters,
} from './interfaces/job-source-adapter.interface';
import { normalizeJob } from './normalizers/job.normalizer';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(JOB_SOURCE_ADAPTER) private readonly adapter: JobSourceAdapter,
    private readonly warehouseAdapter: AmazonWarehouseAdapter,
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
      const searchParams = {
        keywords: search.keywords.map((k) => k.value),
        locations: search.locations.map((l) => ({
          city: l.city,
          state: l.state,
          country: l.country,
        })),
        radiusMiles: search.radiusMiles,
        warehouseFilters: parseWarehouseFilters(search.warehouseFilters),
      };
      const externalJobs =
        search.sourceType === SearchSourceType.AMAZON_WAREHOUSE
          ? await this.warehouseAdapter.search(searchParams)
          : await this.adapter.search(searchParams);

      const normalized = externalJobs.map(normalizeJob);
      const alertJobs: { id: string; title: string; city: string; state: string }[] = [];
      const seenExternalIds: string[] = [];
      const sourceName =
        search.sourceType === SearchSourceType.AMAZON_WAREHOUSE
          ? this.warehouseAdapter.sourceName
          : this.adapter.sourceName;

      for (const nj of normalized) {
        const key = { source_externalId: { source: nj.source, externalId: nj.externalId } };
        const existing = await this.prisma.job.findUnique({ where: key });
        const now = new Date();

        const job = await this.prisma.job.upsert({
          where: key,
          create: { ...nj, firstSeenAt: now, lastSeenAt: now, isActive: true },
          update: { ...nj, lastSeenAt: now, isActive: true },
        });

        await this.prisma.jobSearch.upsert({
          where: { jobId_searchId: { jobId: job.id, searchId } },
          create: { jobId: job.id, searchId },
          update: {},
        });

        seenExternalIds.push(nj.externalId);
        const isNew = !existing;
        const reappeared = Boolean(existing && !existing.isActive);
        if (isNew || reappeared) {
          alertJobs.push(job);
        }
      }

      await this.markMissingJobs(searchId, sourceName, seenExternalIds);

      await this.prisma.monitoringExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.SUCCESS,
          finishedAt: new Date(),
          jobsFound: normalized.length,
          newJobs: alertJobs.length,
        },
      });

      await this.prisma.search.updateMany({
        where: { id: searchId, status: { not: SearchStatus.PAUSED } },
        data: { lastCheckedAt: new Date(), status: SearchStatus.ACTIVE },
      });

      for (const job of alertJobs) {
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
        `Busca ${searchId}: ${normalized.length} vagas encontradas, ${alertJobs.length} novas/reaparecidas`,
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

  private async markMissingJobs(searchId: string, source: string, seenExternalIds: string[]) {
    await this.prisma.job.updateMany({
      where: {
        source,
        jobSearches: { some: { searchId } },
        isActive: true,
        ...(seenExternalIds.length ? { externalId: { notIn: seenExternalIds } } : {}),
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

function parseWarehouseFilters(value: unknown): WarehouseSearchFilters | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const zipCode = typeof raw.zipCode === 'string' ? raw.zipCode.trim() : '';
  if (!zipCode) return undefined;
  return {
    zipCode,
    workHours: typeof raw.workHours === 'number' ? raw.workHours : undefined,
    schedule: Array.isArray(raw.schedule) ? raw.schedule.filter((item): item is string => typeof item === 'string') : [],
    length: typeof raw.length === 'string' ? raw.length : undefined,
    whenStart: typeof raw.whenStart === 'string' ? raw.whenStart : undefined,
    jobTitle: typeof raw.jobTitle === 'string' && raw.jobTitle.trim() ? raw.jobTitle.trim() : undefined,
    employmentType: typeof raw.employmentType === 'string' ? raw.employmentType : undefined,
    payRateMin: typeof raw.payRateMin === 'number' ? raw.payRateMin : undefined,
    payRateMax: typeof raw.payRateMax === 'number' ? raw.payRateMax : undefined,
  };
}

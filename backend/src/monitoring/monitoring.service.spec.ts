import { Test } from '@nestjs/testing';
import { ExecutionStatus, SearchStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { MonitoringQueueService } from '../queues/monitoring-queue.service';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service';
import { JOB_SOURCE_ADAPTER, JobSourceAdapter } from './interfaces/job-source-adapter.interface';
import { MonitoringService } from './monitoring.service';

const SEARCH_FIXTURE = {
  id: 'search-1',
  userId: 'user-1',
  status: SearchStatus.ACTIVE,
  frequencyMinutes: 60,
  radiusMiles: 25,
  notificationChannels: ['EMAIL'],
  keywords: [{ value: 'Warehouse Associate' }],
  locations: [{ city: 'Richmond', state: 'CA', country: 'US' }],
};

const EXTERNAL_JOB = {
  externalId: 'ext-1',
  source: 'amazon',
  title: 'Warehouse Associate',
  company: 'Amazon',
  location: 'Richmond, CA',
  city: 'Richmond',
  state: 'CA',
  country: 'US',
  url: 'https://example.com/job',
  jobType: 'full-time',
};

interface MockedPrisma {
  search: {
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  monitoringExecution: {
    create: jest.Mock;
    update: jest.Mock;
  };
  job: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    updateMany: jest.Mock;
  };
  jobSearch: {
    upsert: jest.Mock;
  };
}

describe('MonitoringService', () => {
  let service: MonitoringService;
  let prisma: MockedPrisma;
  let adapter: jest.Mocked<JobSourceAdapter>;
  let notificationDispatch: { create: jest.Mock };
  let monitoringQueue: { scheduleSearch: jest.Mock; cancelSearch: jest.Mock };

  beforeEach(async () => {
    prisma = {
      search: {
        findUnique: jest.fn().mockResolvedValue(SEARCH_FIXTURE),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      monitoringExecution: {
        create: jest.fn().mockResolvedValue({ id: 'exec-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      job: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      jobSearch: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    adapter = { sourceName: 'amazon', search: jest.fn() };
    notificationDispatch = { create: jest.fn().mockResolvedValue({}) };
    monitoringQueue = {
      scheduleSearch: jest.fn().mockResolvedValue(undefined),
      cancelSearch: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MonitoringService,
        { provide: PrismaService, useValue: prisma },
        { provide: JOB_SOURCE_ADAPTER, useValue: adapter },
        { provide: NotificationDispatchService, useValue: notificationDispatch },
        { provide: MonitoringQueueService, useValue: monitoringQueue },
      ],
    }).compile();

    service = moduleRef.get(MonitoringService);
  });

  it('creates a job and a notification the first time it is found', async () => {
    adapter.search.mockResolvedValue([EXTERNAL_JOB]);
    prisma.job.findUnique.mockResolvedValue(null);
    prisma.job.upsert.mockResolvedValue({
      id: 'job-1',
      title: 'Warehouse Associate',
      city: 'Richmond',
      state: 'CA',
    });

    await service.executeSearch('search-1');

    expect(prisma.job.upsert).toHaveBeenCalledTimes(1);
    expect(notificationDispatch.create).toHaveBeenCalledTimes(1);
    expect(prisma.monitoringExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ExecutionStatus.SUCCESS,
          jobsFound: 1,
          newJobs: 1,
        }),
      }),
    );
  });

  it('does not notify again when the same job is found on a later run (dedup)', async () => {
    adapter.search.mockResolvedValue([EXTERNAL_JOB]);
    prisma.job.findUnique.mockResolvedValue({ id: 'job-1' });
    prisma.job.upsert.mockResolvedValue({
      id: 'job-1',
      title: 'Warehouse Associate',
      city: 'Richmond',
      state: 'CA',
    });

    await service.executeSearch('search-1');

    expect(notificationDispatch.create).not.toHaveBeenCalled();
    expect(prisma.monitoringExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ newJobs: 0 }) }),
    );
  });

  it('records a FAILED execution and puts the search in ERROR when the adapter throws', async () => {
    adapter.search.mockRejectedValue(new Error('source unavailable'));

    await service.executeSearch('search-1');

    expect(prisma.monitoringExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ExecutionStatus.FAILED,
          errorMessage: 'source unavailable',
        }),
      }),
    );
    expect(prisma.search.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: SearchStatus.ERROR }) }),
    );
    expect(notificationDispatch.create).not.toHaveBeenCalled();
  });

  it('reschedules the next run after both success and failure', async () => {
    adapter.search.mockResolvedValue([]);
    await service.executeSearch('search-1');
    expect(monitoringQueue.scheduleSearch).toHaveBeenCalledWith('search-1', 60 * 60_000);

    monitoringQueue.scheduleSearch.mockClear();
    adapter.search.mockRejectedValue(new Error('boom'));
    await service.executeSearch('search-1');
    expect(monitoringQueue.scheduleSearch).toHaveBeenCalledWith('search-1', 60 * 60_000);
  });

  it('does nothing for a paused search', async () => {
    prisma.search.findUnique.mockResolvedValue({ ...SEARCH_FIXTURE, status: SearchStatus.PAUSED });

    await service.executeSearch('search-1');

    expect(adapter.search).not.toHaveBeenCalled();
    expect(prisma.monitoringExecution.create).not.toHaveBeenCalled();
  });

  it('does not reschedule when the search was paused mid-run', async () => {
    adapter.search.mockResolvedValue([]);
    prisma.search.findUnique
      .mockResolvedValueOnce(SEARCH_FIXTURE)
      .mockResolvedValueOnce({ status: SearchStatus.PAUSED });

    await service.executeSearch('search-1');

    expect(monitoringQueue.scheduleSearch).not.toHaveBeenCalled();
  });
});

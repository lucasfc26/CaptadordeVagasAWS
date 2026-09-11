import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { WorkerModule } from '../../src/worker.module';
import { PrismaService } from '../../src/database/prisma.service';
import { MonitoringService } from '../../src/monitoring/monitoring.service';
import { JOB_SOURCE_ADAPTER } from '../../src/monitoring/interfaces/job-source-adapter.interface';
import { cleanDatabase } from '../utils/test-app';

/**
 * Exercises the real domain flow end to end against a live Postgres + Redis
 * (no HTTP layer, no mocked Prisma): create user -> create search ->
 * execute monitoring -> persist job -> detect new job -> create
 * notification -> notification gets delivered by the real BullMQ worker.
 */
describe('Monitoring flow (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let monitoring: MonitoringService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [WorkerModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    monitoring = app.get(MonitoringService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  async function createUserWithSearch() {
    const user = await prisma.user.create({
      data: {
        name: 'Integration Test',
        email: 'integration@jobwatch.test',
        passwordHash: await argon2.hash('password123'),
        settings: { create: {} },
      },
    });

    const search = await prisma.search.create({
      data: {
        userId: user.id,
        name: 'Integration Search',
        radiusMiles: 25,
        frequencyMinutes: 60,
        notificationChannels: ['EMAIL'],
        nextCheckAt: new Date(),
        keywords: { create: [{ value: 'Warehouse' }] },
        locations: { create: [{ city: 'Richmond', state: 'CA', isPrimary: true }] },
      },
    });

    return { user, search };
  }

  async function waitFor<T>(
    check: () => Promise<T | undefined | null>,
    timeoutMs = 5000,
  ): Promise<T> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = await check();
      if (result) return result;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Timed out waiting for condition');
  }

  it('persists new jobs found by the source adapter and links them to the search', async () => {
    const { search } = await createUserWithSearch();

    await monitoring.executeSearch(search.id);

    const jobs = await prisma.job.findMany({
      where: { jobSearches: { some: { searchId: search.id } } },
    });
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.every((job) => job.isActive)).toBe(true);

    const execution = await prisma.monitoringExecution.findFirst({
      where: { searchId: search.id },
    });
    expect(execution?.status).toBe('SUCCESS');
    expect(execution?.jobsFound).toBe(jobs.length);
    expect(execution?.newJobs).toBe(jobs.length);
  });

  it('does not duplicate jobs or notify twice for the same job across executions', async () => {
    const { search } = await createUserWithSearch();

    await monitoring.executeSearch(search.id);
    const firstCount = await prisma.job.count();
    const firstNotifications = await prisma.notification.count();

    await monitoring.executeSearch(search.id);
    const secondCount = await prisma.job.count();
    const secondNotifications = await prisma.notification.count();

    expect(secondCount).toBe(firstCount);
    expect(secondNotifications).toBe(firstNotifications);

    const executions = await prisma.monitoringExecution.findMany({
      where: { searchId: search.id },
    });
    expect(executions).toHaveLength(2);
    expect(executions[1].newJobs).toBe(0);
  });

  it('creates a notification for each new job and the worker delivers it', async () => {
    const { user, search } = await createUserWithSearch();

    await monitoring.executeSearch(search.id);

    const notification = await waitFor(() =>
      prisma.notification.findFirst({ where: { userId: user.id, status: { not: 'PENDING' } } }),
    );

    expect(notification?.type).toBe('NEW_JOB');
    expect(notification?.status).toBe('SENT');

    const delivery = await prisma.notificationDelivery.findFirst({
      where: { notificationId: notification.id },
    });
    expect(delivery?.status).toBe('SENT');
    expect(delivery?.attempts).toBeGreaterThan(0);
  });

  it('is a safe no-op when the search no longer exists', async () => {
    const { search } = await createUserWithSearch();
    await monitoring.executeSearch(search.id);
    const jobsBefore = await prisma.job.count();

    await monitoring.executeSearch('does-not-exist');

    expect(await prisma.job.count()).toBe(jobsBefore);
    expect(await prisma.monitoringExecution.count({ where: { searchId: 'does-not-exist' } })).toBe(
      0,
    );
  });
});

describe('Monitoring flow (integration) - source failure', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let monitoring: MonitoringService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [WorkerModule] })
      .overrideProvider(JOB_SOURCE_ADAPTER)
      .useValue({
        sourceName: 'failing',
        search: () => Promise.reject(new Error('fonte externa indisponível')),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    monitoring = app.get(MonitoringService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('records a FAILED execution and marks the search as ERROR without touching existing jobs', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Integration Test',
        email: 'integration-failure@jobwatch.test',
        passwordHash: await argon2.hash('password123'),
        settings: { create: {} },
      },
    });

    const search = await prisma.search.create({
      data: {
        userId: user.id,
        name: 'Integration Search (failing source)',
        radiusMiles: 25,
        frequencyMinutes: 60,
        notificationChannels: ['EMAIL'],
        nextCheckAt: new Date(),
        keywords: { create: [{ value: 'Warehouse' }] },
        locations: { create: [{ city: 'Richmond', state: 'CA', isPrimary: true }] },
      },
    });

    await monitoring.executeSearch(search.id);

    const execution = await prisma.monitoringExecution.findFirst({
      where: { searchId: search.id },
    });
    expect(execution?.status).toBe('FAILED');
    expect(execution?.errorMessage).toContain('fonte externa indisponível');

    const updatedSearch = await prisma.search.findUniqueOrThrow({ where: { id: search.id } });
    expect(updatedSearch.status).toBe('ERROR');
    expect(updatedSearch.nextCheckAt).not.toBeNull();

    expect(
      await prisma.job.count({ where: { jobSearches: { some: { searchId: search.id } } } }),
    ).toBe(0);
  });
});

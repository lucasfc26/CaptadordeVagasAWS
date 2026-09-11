import { PrismaClient, ExecutionStatus, JobType, NotificationChannel, NotificationStatus, NotificationType, SearchStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('password123');

  const user = await prisma.user.upsert({
    where: { email: 'dev@jobwatch.com' },
    update: {},
    create: {
      name: 'Lucas Cunha',
      email: 'dev@jobwatch.com',
      passwordHash,
      timezone: 'America/Los_Angeles',
      settings: { create: {} },
    },
  });

  const search = await prisma.search.create({
    data: {
      userId: user.id,
      name: 'Amazon Warehouse — Richmond',
      status: SearchStatus.ACTIVE,
      radiusMiles: 25,
      frequencyMinutes: 60,
      jobTypes: [JobType.FULL_TIME],
      notificationChannels: [NotificationChannel.EMAIL],
      lastCheckedAt: new Date(Date.now() - 4 * 60_000),
      nextCheckAt: new Date(Date.now() + 56 * 60_000),
      keywords: {
        create: [
          { value: 'Warehouse Associate' },
          { value: 'Fulfillment Center' },
          { value: 'Delivery Station' },
        ],
      },
      locations: {
        create: [
          { city: 'Richmond', state: 'CA', isPrimary: true },
          { city: 'San Pablo', state: 'CA' },
          { city: 'Pinole', state: 'CA' },
          { city: 'Hercules', state: 'CA' },
          { city: 'El Cerrito', state: 'CA' },
        ],
      },
    },
  });

  const jobsData = [
    {
      externalId: 'seed-1',
      title: 'Warehouse Associate',
      city: 'Richmond',
      state: 'CA',
      minutesAgo: 2,
    },
    {
      externalId: 'seed-2',
      title: 'Fulfillment Center Associate',
      city: 'San Pablo',
      state: 'CA',
      minutesAgo: 40,
    },
    {
      externalId: 'seed-3',
      title: 'Delivery Station Warehouse Associate',
      city: 'Richmond',
      state: 'CA',
      minutesAgo: 180,
    },
  ];

  for (const data of jobsData) {
    const firstSeenAt = new Date(Date.now() - data.minutesAgo * 60_000);
    const job = await prisma.job.upsert({
      where: { source_externalId: { source: 'amazon', externalId: data.externalId } },
      update: {},
      create: {
        externalId: data.externalId,
        source: 'amazon',
        title: data.title,
        company: 'Amazon',
        location: `${data.city}, ${data.state}`,
        city: data.city,
        state: data.state,
        country: 'US',
        url: `https://www.amazon.jobs/en/jobs/${data.externalId}`,
        jobType: JobType.FULL_TIME,
        description: `Vaga de exemplo: ${data.title} em ${data.city}, ${data.state}.`,
        requirements: ['High school diploma or equivalent', 'Able to lift up to 49 pounds'],
        firstSeenAt,
        lastSeenAt: firstSeenAt,
      },
    });

    await prisma.jobSearch.upsert({
      where: { jobId_searchId: { jobId: job.id, searchId: search.id } },
      update: {},
      create: { jobId: job.id, searchId: search.id },
    });

    if (data.externalId !== 'seed-1') {
      await prisma.notification.create({
        data: {
          userId: user.id,
          jobId: job.id,
          searchId: search.id,
          type: NotificationType.NEW_JOB,
          title: 'Nova vaga encontrada',
          message: `${job.title} — ${job.city}, ${job.state}`,
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.SENT,
          sentAt: firstSeenAt,
          createdAt: firstSeenAt,
        },
      });
    }
  }

  await prisma.monitoringExecution.createMany({
    data: [
      {
        searchId: search.id,
        status: ExecutionStatus.SUCCESS,
        jobsFound: 12,
        newJobs: 0,
        startedAt: new Date(Date.now() - 64 * 60_000),
        finishedAt: new Date(Date.now() - 63 * 60_000),
        createdAt: new Date(Date.now() - 64 * 60_000),
      },
      {
        searchId: search.id,
        status: ExecutionStatus.SUCCESS,
        jobsFound: 11,
        newJobs: 1,
        startedAt: new Date(Date.now() - 4 * 60_000),
        finishedAt: new Date(Date.now() - 3 * 60_000),
        createdAt: new Date(Date.now() - 4 * 60_000),
      },
      {
        searchId: search.id,
        status: ExecutionStatus.FAILED,
        jobsFound: 0,
        newJobs: 0,
        errorMessage: 'Falha temporária ao consultar fonte',
        startedAt: new Date(Date.now() - 124 * 60_000),
        finishedAt: new Date(Date.now() - 123 * 60_000),
        createdAt: new Date(Date.now() - 124 * 60_000),
      },
    ],
  });

  console.log('Seed concluído:', { userEmail: user.email, searchId: search.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

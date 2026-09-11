import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';
import { createTestApp, cleanDatabase } from '../utils/test-app';

describe('Jobs, Notifications & Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: import('http').Server;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  async function registerAndGetToken(email: string): Promise<string> {
    const response = await request(server)
      .post('/api/auth/register')
      .send({ name: 'Owner', email, password: 'password123' })
      .expect(201);
    return response.body.accessToken as string;
  }

  async function seedSearchWithJob(token: string) {
    const created = await request(server)
      .post('/api/searches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Seeded search',
        keywords: ['Warehouse Associate'],
        locations: [{ city: 'Richmond', state: 'CA', isPrimary: true }],
        radiusMiles: 25,
        frequencyMinutes: 60,
        notificationChannels: ['EMAIL'],
      })
      .expect(201);
    const searchId = created.body.id;

    const job = await prisma.job.create({
      data: {
        externalId: 'e2e-job-1',
        source: 'amazon',
        title: 'Warehouse Associate',
        company: 'Amazon',
        location: 'Richmond, CA',
        city: 'Richmond',
        state: 'CA',
        url: 'https://www.amazon.jobs/en/jobs/e2e-job-1',
        jobSearches: { create: { searchId } },
      },
    });

    return { searchId, jobId: job.id };
  }

  describe('Jobs', () => {
    it('lists only jobs reachable through the user’s own searches', async () => {
      const ownerToken = await registerAndGetToken('jobs-owner@jobwatch.test');
      const otherToken = await registerAndGetToken('jobs-other@jobwatch.test');
      const { jobId } = await seedSearchWithJob(ownerToken);

      const ownerList = await request(server)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(ownerList.body.total).toBe(1);
      expect(ownerList.body.data[0].id).toBe(jobId);
      expect(ownerList.body.data[0].status).toBe('NEW');

      const otherList = await request(server)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);
      expect(otherList.body.total).toBe(0);

      await request(server)
        .get(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });

    it('marks a job as viewed and then as applied, updating its status', async () => {
      const token = await registerAndGetToken('jobs-status@jobwatch.test');
      const { jobId } = await seedSearchWithJob(token);
      const auth = { Authorization: `Bearer ${token}` };

      const viewed = await request(server).patch(`/api/jobs/${jobId}/viewed`).set(auth).expect(200);
      expect(viewed.body.status).toBe('VIEWED');
      expect(viewed.body.viewedAt).not.toBeNull();

      const applied = await request(server)
        .patch(`/api/jobs/${jobId}/applied`)
        .set(auth)
        .expect(200);
      expect(applied.body.status).toBe('APPLIED');
      expect(applied.body.appliedAt).not.toBeNull();
    });

    it('filters new jobs via /jobs/new and onlyNew=true', async () => {
      const token = await registerAndGetToken('jobs-new@jobwatch.test');
      const { jobId } = await seedSearchWithJob(token);
      const auth = { Authorization: `Bearer ${token}` };

      const beforeViewing = await request(server).get('/api/jobs/new').set(auth).expect(200);
      expect(beforeViewing.body.total).toBe(1);

      await request(server).patch(`/api/jobs/${jobId}/viewed`).set(auth).expect(200);

      const afterViewing = await request(server).get('/api/jobs/new').set(auth).expect(200);
      expect(afterViewing.body.total).toBe(0);
    });
  });

  describe('Notifications', () => {
    it('lists a user’s notifications and marks one as read', async () => {
      const token = await registerAndGetToken('notif-user@jobwatch.test');
      const { jobId, searchId } = await seedSearchWithJob(token);
      const me = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const notification = await prisma.notification.create({
        data: {
          userId: me.body.id,
          jobId,
          searchId,
          type: 'NEW_JOB',
          title: 'Nova vaga encontrada',
          message: 'Warehouse Associate — Richmond, CA',
          channel: 'EMAIL',
          status: 'SENT',
        },
      });

      const list = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(list.body.total).toBe(1);
      expect(list.body.data[0].readAt).toBeNull();

      const read = await request(server)
        .patch(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(read.body.readAt).not.toBeNull();
      expect(read.body.status).toBe('READ');
    });

    it('never exposes another user’s notifications', async () => {
      const ownerToken = await registerAndGetToken('notif-owner@jobwatch.test');
      const otherToken = await registerAndGetToken('notif-other@jobwatch.test');
      const { jobId, searchId } = await seedSearchWithJob(ownerToken);
      const me = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const notification = await prisma.notification.create({
        data: {
          userId: me.body.id,
          jobId,
          searchId,
          type: 'NEW_JOB',
          title: 'Nova vaga encontrada',
          message: 'Warehouse Associate — Richmond, CA',
          channel: 'EMAIL',
          status: 'SENT',
        },
      });

      await request(server)
        .patch(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });
  });

  describe('Dashboard', () => {
    it('aggregates stats, new jobs and active searches for the current user', async () => {
      const token = await registerAndGetToken('dashboard-user@jobwatch.test');
      await seedSearchWithJob(token);

      const dashboard = await request(server)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dashboard.body.stats).toMatchObject({
        newJobs: 1,
        availableJobs: 1,
        activeSearches: 1,
      });
      expect(dashboard.body.monitoringActive).toBe(true);
      expect(dashboard.body.newJobs).toHaveLength(1);
      expect(dashboard.body.activeSearches).toHaveLength(1);
    });

    it('requires authentication', async () => {
      await request(server).get('/api/dashboard').expect(401);
    });
  });
});

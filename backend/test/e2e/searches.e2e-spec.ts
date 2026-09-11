import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';
import { createTestApp, cleanDatabase } from '../utils/test-app';

describe('Searches (e2e)', () => {
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

  const validPayload = {
    name: 'Amazon Warehouse — Richmond',
    keywords: ['Warehouse Associate', 'Fulfillment Center'],
    locations: [
      { city: 'Richmond', state: 'CA', isPrimary: true },
      { city: 'San Pablo', state: 'CA' },
    ],
    radiusMiles: 25,
    frequencyMinutes: 60,
    notificationChannels: ['EMAIL'],
  };

  it('rejects unauthenticated requests', async () => {
    await request(server).get('/api/searches').expect(401);
    await request(server).post('/api/searches').send(validPayload).expect(401);
  });

  it('validates the payload (frequency outside the allowed set, no keywords)', async () => {
    const token = await registerAndGetToken('searches-validation@jobwatch.test');

    await request(server)
      .post('/api/searches')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, frequencyMinutes: 7 })
      .expect(400);

    await request(server)
      .post('/api/searches')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, keywords: [] })
      .expect(400);

    await request(server)
      .post('/api/searches')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, locations: [] })
      .expect(400);
  });

  it('creates, lists, fetches, updates and deletes a search', async () => {
    const token = await registerAndGetToken('searches-crud@jobwatch.test');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(server)
      .post('/api/searches')
      .set(auth)
      .send(validPayload)
      .expect(201);
    expect(created.body.status).toBe('ACTIVE');
    expect(created.body.location).toBe('Richmond, CA');
    expect(created.body.additionalCities).toEqual(['San Pablo']);
    const searchId = created.body.id;

    const list = await request(server).get('/api/searches').set(auth).expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.data[0].id).toBe(searchId);

    const fetched = await request(server).get(`/api/searches/${searchId}`).set(auth).expect(200);
    expect(fetched.body.id).toBe(searchId);

    const updated = await request(server)
      .patch(`/api/searches/${searchId}`)
      .set(auth)
      .send({ name: 'Renamed search' })
      .expect(200);
    expect(updated.body.name).toBe('Renamed search');
    // jobTypes/notificationChannels omitted from the PATCH must be preserved.
    expect(updated.body.notificationChannels).toEqual(['EMAIL']);

    await request(server).delete(`/api/searches/${searchId}`).set(auth).expect(204);
    await request(server).get(`/api/searches/${searchId}`).set(auth).expect(404);
  });

  it('pauses and resumes a search', async () => {
    const token = await registerAndGetToken('searches-pause@jobwatch.test');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(server)
      .post('/api/searches')
      .set(auth)
      .send(validPayload)
      .expect(201);
    const searchId = created.body.id;

    const paused = await request(server)
      .post(`/api/searches/${searchId}/pause`)
      .set(auth)
      .expect(201);
    expect(paused.body.status).toBe('PAUSED');
    expect(paused.body.nextCheckAt).toBeNull();

    const resumed = await request(server)
      .post(`/api/searches/${searchId}/resume`)
      .set(auth)
      .expect(201);
    expect(resumed.body.status).toBe('ACTIVE');
    expect(resumed.body.nextCheckAt).not.toBeNull();
  });

  it('returns the execution history for a search', async () => {
    const token = await registerAndGetToken('searches-history@jobwatch.test');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(server)
      .post('/api/searches')
      .set(auth)
      .send(validPayload)
      .expect(201);
    const searchId = created.body.id;

    await prisma.monitoringExecution.create({
      data: { searchId, status: 'SUCCESS', jobsFound: 3, newJobs: 1 },
    });

    const history = await request(server)
      .get(`/api/searches/${searchId}/history`)
      .set(auth)
      .expect(200);
    expect(history.body.total).toBe(1);
    expect(history.body.data[0].jobsFound).toBe(3);
  });

  it('never lets a user access, modify or delete another user’s search', async () => {
    const ownerToken = await registerAndGetToken('searches-owner@jobwatch.test');
    const intruderToken = await registerAndGetToken('searches-intruder@jobwatch.test');

    const created = await request(server)
      .post('/api/searches')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validPayload)
      .expect(201);
    const searchId = created.body.id;

    const intruderAuth = { Authorization: `Bearer ${intruderToken}` };
    await request(server).get(`/api/searches/${searchId}`).set(intruderAuth).expect(404);
    await request(server)
      .patch(`/api/searches/${searchId}`)
      .set(intruderAuth)
      .send({ name: 'Hijacked' })
      .expect(404);
    await request(server).post(`/api/searches/${searchId}/pause`).set(intruderAuth).expect(404);
    await request(server).delete(`/api/searches/${searchId}`).set(intruderAuth).expect(404);

    // the search must be completely unaffected
    const stillThere = await request(server)
      .get(`/api/searches/${searchId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(stillThere.body.name).toBe(validPayload.name);
    expect(stillThere.body.status).toBe('ACTIVE');
  });
});

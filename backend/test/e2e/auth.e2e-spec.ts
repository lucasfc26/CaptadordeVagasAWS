import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';
import { createTestApp, cleanDatabase } from '../utils/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  const credentials = {
    name: 'E2E User',
    email: 'e2e-auth@jobwatch.test',
    phone: '11999998888',
    password: 'password123',
  };

  it('registers a new user and returns an access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(credentials)
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user).toMatchObject({
      name: credentials.name,
      email: credentials.email,
      phone: '+5511999998888',
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('rejects registering the same email twice', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send(credentials).expect(201);

    await request(app.getHttpServer()).post('/api/auth/register').send(credentials).expect(409);
  });

  it('rejects registration without a phone number', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'No Phone', email: 'nophone@jobwatch.test', password: 'password123' })
      .expect(400);
  });

  it('rejects registration with an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', phone: '123', password: '123' })
      .expect(400);
  });

  it('rejects unknown fields (whitelist validation)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...credentials, isAdmin: true })
      .expect(400);
  });

  it('logs in with valid credentials and rejects invalid ones', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send(credentials).expect(201);

    const ok = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    expect(ok.body.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' })
      .expect(401);
  });

  it('returns the authenticated user on /auth/me and 401 without a token', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(credentials)
      .expect(201);
    const token = register.body.accessToken;

    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.email).toBe(credentials.email);

    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});

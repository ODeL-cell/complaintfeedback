import request from 'supertest';
import { describe, expect, test, beforeAll } from 'vitest';
import { app } from './server.ts';

describe('Secure API behavior', () => {
  let authToken: string;
  const testEmail = `test-${Date.now()}@mut.ac.ke`;
  const testPassword = 'password123';

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      email: testEmail,
      name: 'Test User',
      studentId: 'TEST-001',
      password: testPassword,
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    authToken = loginRes.body.token;
  });

  test('denies complaint update without auth', async () => {
    const response = await request(app)
      .put('/api/complaints/nonexistent')
      .send({ title: 'Updated title' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authorization required.' });
  });

  test('allows login only with correct credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid email or password.' });
  });

  test('returns public complaints without auth', async () => {
    const response = await request(app).get('/api/complaints');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('accepts complaint creation with attachments', async () => {
    const payload = {
      category: 'safety',
      title: 'Attachment test complaint',
      description: 'This complaint has supporting evidence attached.',
      isAnonymous: false,
      email: 'attachment@test.com',
      urgency: 'medium',
      attachments: [
        {
          id: 'att-1',
          name: 'evidence.png',
          size: '12.3 KB',
          type: 'image/png',
          contentBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAUA',
        },
      ],
    };

    const response = await request(app).post('/api/complaints').send(payload);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('attachments');
    expect(Array.isArray(response.body.attachments)).toBe(true);
    expect(response.body.attachments[0]).toMatchObject({
      name: 'evidence.png',
      type: 'image/png',
    });
  });

  test('blocks user list without admin token', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions.' });
  });
});

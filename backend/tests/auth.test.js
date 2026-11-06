import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { app, buildUser, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

function fieldMessages(response) {
  return Object.fromEntries(response.body.errors.map(({ field, message }) => [field, message]));
}

describe('POST /api/auth/register', () => {
  it('creates the user with an empty wallet and hides the password hash', async () => {
    const user = buildUser();

    const response = await request(app).post('/api/auth/register').send(user).expect(201);

    expect(response.body.data.user).toMatchObject({ username: user.username, email: user.email });
    expect(response.body.data.user).not.toHaveProperty('passwordHash');

    const wallet = await prisma.wallet.findFirst({ where: { user: { email: user.email } } });
    expect(wallet.balance).toBe(0n);
  });

  it('returns 422 for an invalid email and a short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(buildUser({ email: 'user@', password: 'short' }))
      .expect(422);

    expect(fieldMessages(response)).toMatchObject({
      email: 'Format email tidak valid.',
      password: 'Password minimal 8 karakter.',
    });
  });

  it('returns 422 when the username is already used', async () => {
    const existing = buildUser();
    await request(app).post('/api/auth/register').send(existing).expect(201);

    const response = await request(app)
      .post('/api/auth/register')
      .send(buildUser({ username: existing.username }))
      .expect(422);

    expect(fieldMessages(response).username).toBe('Username sudah digunakan.');
  });
});

describe('POST /api/auth/login', () => {
  it('sets an httpOnly cookie and does not return the token in the body', async () => {
    const user = buildUser();
    await request(app).post('/api/auth/register').send(user);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(response.headers['set-cookie'][0]).toMatch(/access_token=.+; .*HttpOnly/);
    expect(JSON.stringify(response.body)).not.toContain('token');
  });

  it('returns 401 for a wrong password', async () => {
    const user = buildUser();
    await request(app).post('/api/auth/register').send(user);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);

    expect(response.body.message).toBe('Email atau password salah.');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });
});

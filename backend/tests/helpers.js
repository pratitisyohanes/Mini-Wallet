import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

export const app = createApp();

export async function resetDatabase() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE saved_recipients, transactions, wallets, users CASCADE');
}

let userCounter = 0;

export function buildUser(overrides = {}) {
  userCounter += 1;
  const suffix = String(userCounter).padStart(4, '0');

  return {
    username: `user_${suffix}`,
    email: `user${suffix}@example.com`,
    phone: `0812000${suffix}`,
    password: 'password123',
    ...overrides,
  };
}

/** Registers and logs in a user. Returns a supertest agent that keeps the auth cookie. */
export async function createLoggedInUser(overrides = {}) {
  const user = buildUser(overrides);
  const agent = request.agent(app);

  await agent.post('/api/auth/register').send(user).expect(201);
  await agent.post('/api/auth/login').send({ email: user.email, password: user.password }).expect(200);

  return { agent, user };
}

export async function setBalance(email, balance) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.wallet.update({ where: { userId: user.id }, data: { balance: BigInt(balance) } });
}

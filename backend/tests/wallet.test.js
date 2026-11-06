import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { AMOUNT_MESSAGES } from '../src/validators/amount.validator.js';
import { app, createLoggedInUser, resetDatabase, setBalance } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

async function getBalance(agent) {
  const response = await agent.get('/api/wallet').expect(200);
  return response.body.data.wallet.balance;
}

describe('authorization', () => {
  it.each([
    ['get', '/api/wallet'],
    ['post', '/api/topup'],
    ['post', '/api/transfer'],
    ['get', '/api/transactions'],
    ['get', '/api/wallet/summary'],
  ])('%s %s returns 401 without a token', async (method, path) => {
    await request(app)[method](path).expect(401);
  });

  it('only returns the transactions of the logged-in user', async () => {
    const { agent: alice } = await createLoggedInUser();
    const { agent: budi } = await createLoggedInUser();

    await alice.post('/api/topup').send({ amount: 10000 }).expect(200);

    const response = await budi.get('/api/transactions').expect(200);
    expect(response.body.data.transactions).toHaveLength(0);
  });
});

describe('POST /api/topup', () => {
  it('adds the amount to the balance and records a TOPUP entry', async () => {
    const { agent } = await createLoggedInUser();

    const response = await agent.post('/api/topup').send({ amount: '50000' }).expect(200);

    expect(response.body.data.wallet.balance).toBe(50000);
    expect(response.body.data.transaction).toMatchObject({
      type: 'TOPUP',
      amount: 50000,
      balanceBefore: 0,
      balanceAfter: 50000,
    });
  });

  it.each([
    ['abc', AMOUNT_MESSAGES.notNumber],
    ['', AMOUNT_MESSAGES.required],
    ['10#000', AMOUNT_MESSAGES.notNumber],
    ['-1000', AMOUNT_MESSAGES.notPositive],
    ['99.5', AMOUNT_MESSAGES.notInteger],
    ['999999999', AMOUNT_MESSAGES.exceedsMaximum],
  ])('rejects %j with 422 and saves nothing', async (amount, expectedMessage) => {
    const { agent } = await createLoggedInUser();

    const response = await agent.post('/api/topup').send({ amount }).expect(422);

    expect(response.body.errors[0]).toEqual({ field: 'amount', message: expectedMessage });
    expect(await getBalance(agent)).toBe(0);
    expect(await prisma.transaction.count()).toBe(0);
  });
});

describe('POST /api/transfer', () => {
  it('moves money between wallets and records both sides with one reference id', async () => {
    const { agent: sender, user: senderUser } = await createLoggedInUser();
    const { agent: recipient, user: recipientUser } = await createLoggedInUser();
    await setBalance(senderUser.email, 100000);

    const response = await sender
      .post('/api/transfer')
      .send({ recipient: recipientUser.email, amount: 30000, note: 'Makan siang' })
      .expect(200);

    expect(response.body.data.wallet.balance).toBe(70000);
    expect(await getBalance(recipient)).toBe(30000);

    const entries = await prisma.transaction.findMany();
    expect(entries.map((entry) => entry.type).sort()).toEqual(['TRANSFER_IN', 'TRANSFER_OUT']);
    expect(entries[0].referenceId).toBe(entries[1].referenceId);
  });

  it('finds the recipient by phone number', async () => {
    const { agent: sender, user: senderUser } = await createLoggedInUser();
    const { agent: recipient, user: recipientUser } = await createLoggedInUser();
    await setBalance(senderUser.email, 10000);

    const internationalPhone = recipientUser.phone.replace(/^0/, '+62');
    await sender.post('/api/transfer').send({ recipient: internationalPhone, amount: 5000 }).expect(200);

    expect(await getBalance(recipient)).toBe(5000);
  });

  it('returns 400 when the balance is not enough and changes nothing', async () => {
    const { agent: sender, user: senderUser } = await createLoggedInUser();
    const { agent: recipient, user: recipientUser } = await createLoggedInUser();
    await setBalance(senderUser.email, 10000);

    const response = await sender
      .post('/api/transfer')
      .send({ recipient: recipientUser.email, amount: 20000 })
      .expect(400);

    expect(response.body.message).toBe('Saldo tidak cukup.');
    expect(await getBalance(sender)).toBe(10000);
    expect(await getBalance(recipient)).toBe(0);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it('returns 404 for an unknown recipient and 400 for a transfer to yourself', async () => {
    const { agent, user } = await createLoggedInUser();
    await setBalance(user.email, 10000);

    await agent.post('/api/transfer').send({ recipient: 'nobody@example.com', amount: 1000 }).expect(404);
    await agent.post('/api/transfer').send({ recipient: user.email, amount: 1000 }).expect(400);
  });

  it('never lets concurrent transfers push the balance below zero', async () => {
    const { agent: sender, user: senderUser } = await createLoggedInUser();
    const { agent: recipient, user: recipientUser } = await createLoggedInUser();
    await setBalance(senderUser.email, 50000);

    // Five parallel requests of 20.000 against a 50.000 balance: exactly two can succeed.
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        sender.post('/api/transfer').send({ recipient: recipientUser.email, amount: 20000 }),
      ),
    );

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 200, 400, 400, 400]);
    expect(await getBalance(sender)).toBe(10000);
    expect(await getBalance(recipient)).toBe(40000);
  });

  it('is rejected by the database if a balance would ever go negative', async () => {
    const { user } = await createLoggedInUser();

    await expect(setBalance(user.email, -1)).rejects.toThrow();
  });
});

describe('GET /api/transactions', () => {
  it('returns newest first with pagination', async () => {
    const { agent } = await createLoggedInUser();
    for (const amount of [1000, 2000, 3000]) {
      await agent.post('/api/topup').send({ amount }).expect(200);
    }

    const response = await agent.get('/api/transactions?page=1&limit=2').expect(200);

    expect(response.body.data.transactions.map((entry) => entry.amount)).toEqual([3000, 2000]);
    expect(response.body.data.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });
});

describe('GET /api/wallet/summary', () => {
  it('totals money in and out and fills the last 7 days', async () => {
    const { agent: sender } = await createLoggedInUser();
    const { agent: recipient, user: recipientUser } = await createLoggedInUser();

    await sender.post('/api/topup').send({ amount: 100000 }).expect(200);
    await sender.post('/api/transfer').send({ recipient: recipientUser.email, amount: 30000 }).expect(200);

    const senderSummary = (await sender.get('/api/wallet/summary').expect(200)).body.data.summary;
    expect(senderSummary).toMatchObject({ balance: 70000, totalIn: 100000, totalOut: 30000 });
    expect(senderSummary.daily).toHaveLength(7);
    expect(senderSummary.daily.at(-1)).toMatchObject({ moneyIn: 100000, moneyOut: 30000 });

    const recipientSummary = (await recipient.get('/api/wallet/summary').expect(200)).body.data.summary;
    expect(recipientSummary).toMatchObject({ balance: 30000, totalIn: 30000, totalOut: 0 });
  });

  it('returns zeros for a new wallet', async () => {
    const { agent } = await createLoggedInUser();

    const { summary } = (await agent.get('/api/wallet/summary').expect(200)).body.data;

    expect(summary).toMatchObject({ balance: 0, totalIn: 0, totalOut: 0 });
    expect(summary.daily.every((day) => day.moneyIn === 0 && day.moneyOut === 0)).toBe(true);
  });
});

import { createHash } from 'node:crypto';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { MIN_PAYMENT_MESSAGE } from '../src/validators/payment.validator.js';
import { app, createLoggedInUser, resetDatabase } from './helpers.js';

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const NOTIFICATION_PATH = '/api/payments/midtrans/notification';

beforeEach(resetDatabase);
afterEach(() => vi.restoreAllMocks());
afterAll(() => prisma.$disconnect());

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Fakes the two Midtrans endpoints the backend calls: Snap (create) and Core API (status).
 * `statusFor(orderId)` decides what the status endpoint answers.
 */
function mockMidtrans({ statusFor = () => null } = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const target = String(url);

    if (target.endsWith('/snap/v1/transactions')) {
      return jsonResponse({ token: 'snap-token', redirect_url: 'https://app.sandbox.midtrans.com/snap/v4/redirection/snap-token' }, 201);
    }

    const orderId = decodeURIComponent(target.match(/\/v2\/([^/]+)\/status$/)?.[1] ?? '');
    const status = statusFor(orderId);
    return jsonResponse(status ?? { status_code: '404', status_message: 'Transaction doesn\'t exist.' });
  });
}

function signedNotification({ orderId, grossAmount, statusCode = '200', transactionStatus = 'settlement' }) {
  const signature = createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`)
    .digest('hex');

  return {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    transaction_status: transactionStatus,
    signature_key: signature,
  };
}

function midtransStatus(orderId, amount, transactionStatus, extra = {}) {
  return {
    status_code: '200',
    order_id: orderId,
    gross_amount: `${amount}.00`,
    transaction_status: transactionStatus,
    payment_type: 'bank_transfer',
    transaction_id: 'midtrans-trx-1',
    ...extra,
  };
}

async function createPayment(agent, amount = 50000) {
  const response = await agent.post('/api/payments/topup').send({ amount }).expect(201);
  return response.body.data.payment;
}

async function getBalance(agent) {
  const response = await agent.get('/api/wallet').expect(200);
  return response.body.data.wallet.balance;
}

describe('POST /api/payments/topup', () => {
  it('returns 401 without a token', async () => {
    await request(app).post('/api/payments/topup').send({ amount: 50000 }).expect(401);
  });

  it('creates a PENDING payment with a Midtrans payment page and does not touch the balance', async () => {
    const fetchMock = mockMidtrans();
    const { agent } = await createLoggedInUser();

    const payment = await createPayment(agent, 50000);

    expect(payment).toMatchObject({ amount: 50000, status: 'PENDING' });
    expect(payment.orderId).toMatch(/^MW-/);
    expect(payment.redirectUrl).toContain('midtrans.com');
    expect(await getBalance(agent)).toBe(0);

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).transaction_details).toEqual({ order_id: payment.orderId, gross_amount: 50000 });
  });

  it('rejects amounts below the online payment minimum', async () => {
    mockMidtrans();
    const { agent } = await createLoggedInUser();

    const response = await agent.post('/api/payments/topup').send({ amount: 5000 }).expect(422);

    expect(response.body.errors[0].message).toBe(MIN_PAYMENT_MESSAGE);
    expect(await prisma.payment.count()).toBe(0);
  });

  it('marks the payment FAILED when Midtrans rejects it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error_messages: ['bad'] }, 400));
    const { agent } = await createLoggedInUser();

    await agent.post('/api/payments/topup').send({ amount: 50000 }).expect(502);

    const payment = await prisma.payment.findFirstOrThrow();
    expect(payment.status).toBe('FAILED');
  });
});

describe('POST /api/payments/midtrans/notification', () => {
  it('rejects a notification with a wrong signature and credits nothing', async () => {
    mockMidtrans({ statusFor: (orderId) => midtransStatus(orderId, 50000, 'settlement') });
    const { agent } = await createLoggedInUser();
    const payment = await createPayment(agent);

    const forged = { ...signedNotification({ orderId: payment.orderId, grossAmount: '50000.00' }), signature_key: 'f'.repeat(128) };
    await request(app).post(NOTIFICATION_PATH).send(forged).expect(403);

    expect(await getBalance(agent)).toBe(0);
  });

  it('credits the wallet once, even when Midtrans sends the notification twice', async () => {
    mockMidtrans({ statusFor: (orderId) => midtransStatus(orderId, 50000, 'settlement') });
    const { agent } = await createLoggedInUser();
    const payment = await createPayment(agent);
    const notification = signedNotification({ orderId: payment.orderId, grossAmount: '50000.00' });

    await Promise.all([
      request(app).post(NOTIFICATION_PATH).send(notification).expect(200),
      request(app).post(NOTIFICATION_PATH).send(notification).expect(200),
    ]);
    await request(app).post(NOTIFICATION_PATH).send(notification).expect(200);

    expect(await getBalance(agent)).toBe(50000);
    const entries = await prisma.transaction.findMany();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ type: 'TOPUP', description: 'Top up via Midtrans' });

    const stored = await prisma.payment.findUniqueOrThrow({ where: { orderId: payment.orderId } });
    expect(stored).toMatchObject({ status: 'PAID', paymentType: 'bank_transfer' });
    expect(stored.paidAt).not.toBeNull();
  });

  it('uses the status from the Midtrans API, not the status claimed in the notification', async () => {
    mockMidtrans({ statusFor: (orderId) => midtransStatus(orderId, 50000, 'pending') });
    const { agent } = await createLoggedInUser();
    const payment = await createPayment(agent);

    const claimsPaid = signedNotification({ orderId: payment.orderId, grossAmount: '50000.00', transactionStatus: 'settlement' });
    await request(app).post(NOTIFICATION_PATH).send(claimsPaid).expect(200);

    expect(await getBalance(agent)).toBe(0);
  });

  it('refuses a payment whose amount differs from the order', async () => {
    mockMidtrans({ statusFor: (orderId) => midtransStatus(orderId, 1000, 'settlement') });
    const { agent } = await createLoggedInUser();
    const payment = await createPayment(agent, 50000);

    const notification = signedNotification({ orderId: payment.orderId, grossAmount: '1000.00' });
    await request(app).post(NOTIFICATION_PATH).send(notification).expect(400);

    expect(await getBalance(agent)).toBe(0);
  });

  it('marks an expired payment EXPIRED without crediting', async () => {
    mockMidtrans({ statusFor: (orderId) => midtransStatus(orderId, 50000, 'expire') });
    const { agent } = await createLoggedInUser();
    const payment = await createPayment(agent);

    const notification = signedNotification({ orderId: payment.orderId, grossAmount: '50000.00', statusCode: '407', transactionStatus: 'expire' });
    await request(app).post(NOTIFICATION_PATH).send(notification).expect(200);

    expect(await getBalance(agent)).toBe(0);
    const stored = await prisma.payment.findUniqueOrThrow({ where: { orderId: payment.orderId } });
    expect(stored.status).toBe('EXPIRED');
  });

  it('ignores a validly signed notification for an order it does not know', async () => {
    mockMidtrans({ statusFor: (orderId) => midtransStatus(orderId, 50000, 'settlement') });

    const notification = signedNotification({ orderId: 'MW-unknown', grossAmount: '50000.00' });
    const response = await request(app).post(NOTIFICATION_PATH).send(notification).expect(200);

    expect(response.body.data).toEqual({ processed: false });
  });
});

describe('GET /api/payments/:orderId', () => {
  it('refreshes a pending payment from Midtrans and returns the new balance once paid', async () => {
    let midtransState = 'pending';
    mockMidtrans({ statusFor: (orderId) => midtransStatus(orderId, 75000, midtransState) });
    const { agent } = await createLoggedInUser();
    const payment = await createPayment(agent, 75000);

    const pending = await agent.get(`/api/payments/${payment.orderId}`).expect(200);
    expect(pending.body.data.payment.status).toBe('PENDING');
    expect(pending.body.data.wallet).toBeNull();

    midtransState = 'settlement';
    const paid = await agent.get(`/api/payments/${payment.orderId}`).expect(200);
    expect(paid.body.data.payment).toMatchObject({ status: 'PAID', redirectUrl: null });
    expect(paid.body.data.wallet.balance).toBe(75000);
  });

  it('keeps the payment PENDING while the user has not chosen a payment method', async () => {
    mockMidtrans();
    const { agent } = await createLoggedInUser();
    const payment = await createPayment(agent);

    const response = await agent.get(`/api/payments/${payment.orderId}`).expect(200);

    expect(response.body.data.payment.status).toBe('PENDING');
  });

  it('does not show another user\'s payment', async () => {
    mockMidtrans();
    const { agent: alice } = await createLoggedInUser();
    const { agent: budi } = await createLoggedInUser();
    const payment = await createPayment(alice);

    await budi.get(`/api/payments/${payment.orderId}`).expect(404);
  });
});

describe('GET /api/payments/config', () => {
  it('reports that online payment is enabled', async () => {
    const { agent } = await createLoggedInUser();

    const response = await agent.get('/api/payments/config').expect(200);

    expect(response.body.data).toMatchObject({ midtransEnabled: true, directTopUpEnabled: true, minAmount: 10000 });
  });
});

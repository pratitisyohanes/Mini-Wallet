import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const REQUEST_TIMEOUT_MS = 15_000;

const SNAP_BASE_URL = env.midtrans.isProduction
  ? 'https://app.midtrans.com'
  : 'https://app.sandbox.midtrans.com';

const CORE_API_BASE_URL = env.midtrans.isProduction
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com';

function authorizationHeader() {
  // Midtrans uses HTTP Basic auth with the server key as the username and an empty password.
  return `Basic ${Buffer.from(`${env.midtrans.serverKey}:`).toString('base64')}`;
}

async function callMidtrans(url, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authorizationHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error('Midtrans request failed:', error.message);
    throw new AppError(502, 'Layanan pembayaran tidak dapat dihubungi. Silakan coba lagi.');
  }

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, httpStatus: response.status, data };
}

/** Creates a Snap transaction. Returns the hosted payment page URL for the user. */
export async function createSnapTransaction(payload) {
  const { ok, httpStatus, data } = await callMidtrans(`${SNAP_BASE_URL}/snap/v1/transactions`, {
    method: 'POST',
    body: payload,
  });

  if (!ok || !data.redirect_url) {
    console.error('Midtrans Snap rejected the transaction:', httpStatus, data.error_messages ?? data);
    throw new AppError(502, 'Pembayaran tidak dapat dibuat. Silakan coba lagi.');
  }

  return { token: data.token, redirectUrl: data.redirect_url };
}

/**
 * Reads the current status of an order straight from Midtrans.
 * Returns null while the order has no transaction yet (the user has not picked a payment method).
 */
export async function getTransactionStatus(orderId) {
  const { ok, data } = await callMidtrans(
    `${CORE_API_BASE_URL}/v2/${encodeURIComponent(orderId)}/status`,
  );

  // Midtrans answers an unknown order with HTTP 200 and status_code "404" in the body.
  if (data.status_code === '404') return null;

  if (!ok || !data.transaction_status) {
    console.error('Midtrans status check failed:', data.status_code, data.status_message);
    throw new AppError(502, 'Status pembayaran tidak dapat diperiksa. Silakan coba lagi.');
  }

  return data;
}

/**
 * Checks the signature Midtrans puts on every notification:
 * SHA512(order_id + status_code + gross_amount + server key).
 */
export function isValidNotificationSignature({ order_id, status_code, gross_amount, signature_key }) {
  if (![order_id, status_code, gross_amount, signature_key].every((value) => typeof value === 'string')) {
    return false;
  }

  const expected = createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${env.midtrans.serverKey}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature_key);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

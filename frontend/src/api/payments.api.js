import { apiClient } from './client.js';

/** Which top-up methods the server offers: Midtrans payment and/or instant demo top-up. */
export async function getPaymentConfig() {
  const { data } = await apiClient.get('/payments/config');
  return data.data;
}

/** Creates a Midtrans order. The response carries the Midtrans payment page URL. */
export async function createTopUpPayment(amount) {
  const { data } = await apiClient.post('/payments/topup', { amount });
  return data.data.payment;
}

/** Current status of one order, refreshed from Midtrans while it is still pending. */
export async function getPayment(orderId) {
  const { data } = await apiClient.get(`/payments/${encodeURIComponent(orderId)}`);
  return data.data;
}

const PENDING_ORDER_KEY = 'mini-wallet:pending-order';

/** Remembers the order before leaving for Midtrans, in case the return URL lacks order_id. */
export function rememberPendingOrder(orderId) {
  try {
    sessionStorage.setItem(PENDING_ORDER_KEY, orderId);
  } catch {
    // Storage can be blocked. Midtrans normally adds order_id to the return URL anyway.
  }
}

export function readPendingOrder() {
  try {
    return sessionStorage.getItem(PENDING_ORDER_KEY);
  } catch {
    return null;
  }
}

import { apiClient } from './client.js';

export async function getWallet() {
  const { data } = await apiClient.get('/wallet');
  return data.data.wallet;
}

/** Balance, all-time money in/out, and a 7-day daily breakdown for the dashboard. */
export async function getSummary() {
  const { data } = await apiClient.get('/wallet/summary');
  return data.data.summary;
}

export async function topUp(amount) {
  const { data } = await apiClient.post('/topup', { amount });
  return data.data;
}

export async function transfer({ recipient, amount, note }) {
  const { data } = await apiClient.post('/transfer', { recipient, amount, note: note || undefined });
  return data.data;
}

export async function getTransactions({ page, limit, type }) {
  const { data } = await apiClient.get('/transactions', {
    params: { page, limit, type: type || undefined },
  });
  return data.data;
}

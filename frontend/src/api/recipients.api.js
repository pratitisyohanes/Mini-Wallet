import { apiClient } from './client.js';

export async function listRecipients() {
  const { data } = await apiClient.get('/recipients');
  return data.data.recipients;
}

export async function addRecipient({ identifier, alias }) {
  const { data } = await apiClient.post('/recipients', { identifier, alias: alias || undefined });
  return data.data.recipient;
}

export async function removeRecipient(id) {
  await apiClient.delete(`/recipients/${id}`);
}

import { apiClient } from './client.js';

export async function register(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data.data.user;
}

export async function login(credentials) {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data.data.user;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function getCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.data.user;
}

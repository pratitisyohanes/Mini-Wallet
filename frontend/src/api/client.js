import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  // Sends the httpOnly auth cookie with every request.
  withCredentials: true,
  timeout: 15000,
});

let handleUnauthorized = () => {};

/** Lets the auth context decide what happens when the session expires. */
export function setUnauthorizedHandler(handler) {
  handleUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isSessionCheck = error.config?.url === '/auth/me';
    const isLoginAttempt = error.config?.url === '/auth/login';

    if (error.response?.status === 401 && !isSessionCheck && !isLoginAttempt) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  },
);

/** Turns an Axios error into a message and field errors the UI can display. */
export function parseApiError(error) {
  if (!error.response) {
    return {
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      fieldErrors: {},
    };
  }

  const { message, errors = [] } = error.response.data ?? {};
  const fieldErrors = Object.fromEntries(errors.map((item) => [item.field, item.message]));

  return {
    message: message ?? 'Terjadi kesalahan. Silakan coba lagi.',
    fieldErrors,
  };
}

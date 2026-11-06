import * as authService from '../services/auth.service.js';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie.js';
import { sendSuccess } from '../utils/response.js';
import { toUserDto } from '../utils/serializers.js';

export async function register(req, res) {
  const user = await authService.registerUser(req.validated);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Registrasi berhasil. Silakan login.',
    data: { user: toUserDto(user) },
  });
}

export async function login(req, res) {
  const { user, token } = await authService.loginUser(req.validated);

  setAuthCookie(res, token);
  sendSuccess(res, {
    message: 'Login berhasil.',
    data: { user: toUserDto(user) },
  });
}

export function logout(req, res) {
  clearAuthCookie(res);
  sendSuccess(res, { message: 'Logout berhasil.' });
}

export async function getCurrentUser(req, res) {
  const user = await authService.getUserById(req.user.id);

  sendSuccess(res, {
    message: 'Data user berhasil diambil.',
    data: { user: toUserDto(user) },
  });
}

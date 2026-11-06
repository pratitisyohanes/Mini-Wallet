import { env } from '../config/env.js';
import { AUTH_COOKIE_MAX_AGE_MS, AUTH_COOKIE_NAME } from '../config/constants.js';

const baseCookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: '/',
};

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseCookieOptions, maxAge: AUTH_COOKIE_MAX_AGE_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions);
}

import { AUTH_COOKIE_NAME } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/token.js';

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  return authorizationHeader.slice('Bearer '.length).trim();
}

/**
 * Reads the JWT from the httpOnly cookie (browser) or the Authorization header
 * (API clients), then exposes the authenticated user id as req.user.id.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME] ?? extractBearerToken(req.headers.authorization);

  if (!token) {
    throw new AppError(401, 'Silakan login terlebih dahulu.');
  }

  let userId;
  try {
    userId = verifyAccessToken(token);
  } catch {
    throw new AppError(401, 'Sesi tidak valid atau sudah berakhir. Silakan login kembali.');
  }

  req.user = { id: userId };
  next();
}

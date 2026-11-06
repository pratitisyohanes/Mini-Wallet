import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

/** Returns the user id stored in the token. Throws if the token is invalid or expired. */
export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  return payload.sub;
}

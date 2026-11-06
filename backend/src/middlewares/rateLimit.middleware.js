import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** Slows down brute-force attempts on login and register. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.',
  },
});

/**
 * Adding a recipient tells the caller whether an email or phone is registered,
 * so it is limited to stop someone from probing many addresses.
 */
export const recipientLookupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: {
    success: false,
    message: 'Terlalu banyak penambahan penerima. Silakan coba lagi dalam 15 menit.',
  },
});

import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../config/constants.js';
import { PHONE_PATTERN, normalizePhone } from '../utils/phone.js';
import { requiredString } from './common.validator.js';

const emailSchema = requiredString('Email')
  .trim()
  .toLowerCase()
  .min(1, 'Email wajib diisi.')
  .email('Format email tidak valid.');

export const registerSchema = z.object({
  username: requiredString('Username')
    .trim()
    .toLowerCase()
    .min(3, 'Username minimal 3 karakter.')
    .max(30, 'Username maksimal 30 karakter.')
    .regex(/^[a-z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore.'),
  email: emailSchema,
  phone: requiredString('Nomor HP')
    .trim()
    .regex(PHONE_PATTERN, 'Format nomor HP tidak valid. Contoh: 081234567890.')
    .transform(normalizePhone),
  password: requiredString('Password')
    .min(PASSWORD_MIN_LENGTH, `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`)
    .max(PASSWORD_MAX_LENGTH, `Password maksimal ${PASSWORD_MAX_LENGTH} karakter.`),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: requiredString('Password').min(1, 'Password wajib diisi.'),
});

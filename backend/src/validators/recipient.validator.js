import { z } from 'zod';
import { PHONE_PATTERN } from '../utils/phone.js';
import { requiredString } from './common.validator.js';

export const RECIPIENT_ALIAS_MAX_LENGTH = 50;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const addRecipientSchema = z.object({
  identifier: requiredString('Email atau nomor HP penerima')
    .trim()
    .min(1, 'Email atau nomor HP penerima wajib diisi.')
    .refine(
      (value) => (value.includes('@') ? EMAIL_PATTERN.test(value) : PHONE_PATTERN.test(value)),
      'Masukkan email atau nomor HP yang valid.',
    ),
  alias: z
    .string({ error: 'Nama panggilan harus berupa teks.' })
    .trim()
    .max(RECIPIENT_ALIAS_MAX_LENGTH, `Nama panggilan maksimal ${RECIPIENT_ALIAS_MAX_LENGTH} karakter.`)
    // An empty alias means "no alias", so the list falls back to the username.
    .transform((value) => value || null)
    .optional(),
});

export const recipientIdParamSchema = z.object({
  id: z.uuid({ error: 'Id penerima tidak valid.' }),
});

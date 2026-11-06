import { z } from 'zod';
import { PAGINATION, TRANSACTION_TYPES } from '../config/constants.js';
import { amountSchema } from './amount.validator.js';
import { requiredString } from './common.validator.js';

const positiveIntegerQuery = (fieldLabel, { max, defaultValue }) =>
  z.coerce
    .number({ error: `${fieldLabel} harus berupa angka.` })
    .int(`${fieldLabel} harus berupa bilangan bulat.`)
    .min(1, `${fieldLabel} minimal 1.`)
    .max(max, `${fieldLabel} maksimal ${max}.`)
    .default(defaultValue);

export const topUpSchema = z.object({
  amount: amountSchema,
});

export const transferSchema = z.object({
  recipient: requiredString('Email atau nomor HP penerima')
    .trim()
    .min(1, 'Email atau nomor HP penerima wajib diisi.'),
  amount: amountSchema,
  note: z
    .string({ error: 'Catatan harus berupa teks.' })
    .trim()
    .max(100, 'Catatan maksimal 100 karakter.')
    .optional(),
});

export const transactionQuerySchema = z.object({
  page: positiveIntegerQuery('Halaman', {
    max: Number.MAX_SAFE_INTEGER,
    defaultValue: PAGINATION.defaultPage,
  }),
  limit: positiveIntegerQuery('Limit', {
    max: PAGINATION.maxLimit,
    defaultValue: PAGINATION.defaultLimit,
  }),
  type: z.enum(TRANSACTION_TYPES, { error: 'Tipe transaksi tidak valid.' }).optional(),
});

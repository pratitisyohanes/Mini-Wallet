import { z } from 'zod';
import { MIN_PAYMENT_AMOUNT } from '../config/constants.js';
import { amountSchema } from './amount.validator.js';

export const MIN_PAYMENT_MESSAGE = `Nominal minimal Rp${MIN_PAYMENT_AMOUNT.toLocaleString('id-ID')} untuk pembayaran online.`;

export const createPaymentSchema = z.object({
  amount: amountSchema.refine((amount) => amount >= MIN_PAYMENT_AMOUNT, MIN_PAYMENT_MESSAGE),
});

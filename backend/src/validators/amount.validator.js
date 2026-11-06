import { z } from 'zod';
import { MAX_TRANSACTION_AMOUNT } from '../config/constants.js';

export const AMOUNT_MESSAGES = {
  required: 'Nominal tidak boleh kosong.',
  notNumber: 'Nominal harus berupa angka.',
  notInteger: 'Nominal harus berupa bilangan bulat.',
  notPositive: 'Nominal harus lebih dari 0.',
  exceedsMaximum: 'Nominal melebihi batas maksimum transaksi.',
};

const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;
const INTEGER_PATTERN = /^-?\d+$/;

/**
 * Returns the error message for an invalid amount, or null when the amount is valid.
 *
 * The value is checked as text before converting it to a number, so inputs such as
 * "12abc", "1e5", or "Rp100" are rejected instead of being silently coerced.
 */
export function getAmountError(rawValue) {
  const value = rawValue === undefined || rawValue === null ? '' : String(rawValue).trim();

  if (value === '') return AMOUNT_MESSAGES.required;
  if (!NUMERIC_PATTERN.test(value)) return AMOUNT_MESSAGES.notNumber;
  if (!INTEGER_PATTERN.test(value)) return AMOUNT_MESSAGES.notInteger;

  const amount = Number(value);
  if (amount <= 0) return AMOUNT_MESSAGES.notPositive;
  if (amount > MAX_TRANSACTION_AMOUNT) return AMOUNT_MESSAGES.exceedsMaximum;

  return null;
}

export const amountSchema = z.unknown().transform((value, context) => {
  const errorMessage = getAmountError(value);

  if (errorMessage) {
    context.addIssue({ code: 'custom', message: errorMessage });
    return z.NEVER;
  }

  return Number(String(value).trim());
});

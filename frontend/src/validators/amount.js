import { MAX_TRANSACTION_AMOUNT } from '../config/constants.js';

const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;
const INTEGER_PATTERN = /^-?\d+$/;

/**
 * Mirrors getAmountError in the backend so the user sees the same message
 * before the request is sent. The backend still validates every request.
 */
export function getAmountError(rawValue) {
  const value = String(rawValue ?? '').trim();

  if (value === '') return 'Nominal tidak boleh kosong.';
  if (!NUMERIC_PATTERN.test(value)) return 'Nominal harus berupa angka.';
  if (!INTEGER_PATTERN.test(value)) return 'Nominal harus berupa bilangan bulat.';

  const amount = Number(value);
  if (amount <= 0) return 'Nominal harus lebih dari 0.';
  if (amount > MAX_TRANSACTION_AMOUNT) return 'Nominal melebihi batas maksimum transaksi.';

  return null;
}

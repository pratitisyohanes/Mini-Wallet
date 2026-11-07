/** Maximum amount (in Rupiah) allowed for a single top-up or transfer. */
export const MAX_TRANSACTION_AMOUNT = 10_000_000;

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only uses the first 72 bytes of a password.
export const PASSWORD_MAX_LENGTH = 72;
export const BCRYPT_SALT_ROUNDS = 10;

export const AUTH_COOKIE_NAME = 'access_token';
export const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 50,
};

export const TRANSACTION_TYPES = ['TOPUP', 'TRANSFER_IN', 'TRANSFER_OUT'];

/** Smallest top-up paid through Midtrans, in Rupiah. Some payment methods reject smaller amounts. */
export const MIN_PAYMENT_AMOUNT = 10_000;

/** Number of days in the dashboard cash-flow chart. */
export const SUMMARY_DAYS = 7;

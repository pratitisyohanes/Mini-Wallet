import { describe, expect, it } from 'vitest';
import { MAX_TRANSACTION_AMOUNT } from '../src/config/constants.js';
import { AMOUNT_MESSAGES, getAmountError } from '../src/validators/amount.validator.js';

describe('getAmountError', () => {
  it.each([
    [undefined, AMOUNT_MESSAGES.required],
    ['', AMOUNT_MESSAGES.required],
    ['   ', AMOUNT_MESSAGES.required],
    ['abc', AMOUNT_MESSAGES.notNumber],
    ['12abc', AMOUNT_MESSAGES.notNumber],
    ['50$', AMOUNT_MESSAGES.notNumber],
    ['Rp100', AMOUNT_MESSAGES.notNumber],
    ['1e5', AMOUNT_MESSAGES.notNumber],
    [true, AMOUNT_MESSAGES.notNumber],
    ['1500.5', AMOUNT_MESSAGES.notInteger],
    [1500.5, AMOUNT_MESSAGES.notInteger],
    ['-5000', AMOUNT_MESSAGES.notPositive],
    ['0', AMOUNT_MESSAGES.notPositive],
    [String(MAX_TRANSACTION_AMOUNT + 1), AMOUNT_MESSAGES.exceedsMaximum],
  ])('rejects %j', (input, expectedMessage) => {
    expect(getAmountError(input)).toBe(expectedMessage);
  });

  it.each(['1', '50000', 50000, String(MAX_TRANSACTION_AMOUNT)])('accepts %j', (input) => {
    expect(getAmountError(input)).toBeNull();
  });
});

/** Indonesian mobile number starting with 08, 628, or +628. */
export const PHONE_PATTERN = /^(\+62|62|0)8[1-9]\d{6,11}$/;

export function isValidPhone(value) {
  return PHONE_PATTERN.test(value);
}

/** Converts +62 / 62 prefixes to the local 0 prefix, so every number is stored the same way. */
export function normalizePhone(value) {
  return value.replace(/^(\+62|62)/, '0');
}

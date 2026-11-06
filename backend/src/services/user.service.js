import { prisma } from '../lib/prisma.js';
import { isValidPhone, normalizePhone } from '../utils/phone.js';

/**
 * Finds a user by email or Indonesian phone number. Returns null when nobody matches.
 *
 * Used by both transfers and saved recipients, so the two features always agree on
 * who "yohanes@example.com" or "+6281200000002" refers to.
 */
export async function findUserByIdentifier(identifier, select = { id: true }) {
  const value = identifier.trim();

  if (value.includes('@')) {
    return prisma.user.findUnique({ where: { email: value.toLowerCase() }, select });
  }

  if (isValidPhone(value)) {
    return prisma.user.findUnique({ where: { phone: normalizePhone(value) }, select });
  }

  return null;
}

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError, validationError } from '../utils/AppError.js';
import { findUserByIdentifier } from './user.service.js';

const recipientSelect = {
  id: true,
  alias: true,
  createdAt: true,
  recipient: { select: { username: true, email: true, phone: true } },
};

const duplicateRecipientError = () =>
  validationError([{ field: 'identifier', message: 'Penerima sudah ada di daftar.' }]);

function isUniqueConstraintError(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function listRecipients(ownerUserId) {
  // Scoped by the logged-in user, so nobody can read another user's contacts.
  return prisma.savedRecipient.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: 'desc' },
    select: recipientSelect,
  });
}

export async function addRecipient(ownerUserId, { identifier, alias }) {
  const recipientUser = await findUserByIdentifier(identifier);

  // Same rules and messages as a transfer: only registered users, never yourself.
  if (!recipientUser) {
    throw new AppError(404, 'Penerima tidak ditemukan.');
  }
  if (recipientUser.id === ownerUserId) {
    throw new AppError(400, 'Tidak dapat menyimpan akun sendiri sebagai penerima.');
  }

  try {
    return await prisma.savedRecipient.create({
      data: { ownerUserId, recipientUserId: recipientUser.id, alias: alias ?? null },
      select: recipientSelect,
    });
  } catch (error) {
    // The unique (owner, recipient) index rejects duplicates, even when two requests race.
    if (isUniqueConstraintError(error)) {
      throw duplicateRecipientError();
    }
    throw error;
  }
}

export async function removeRecipient(ownerUserId, recipientId) {
  // deleteMany with the owner in the filter: a contact that belongs to someone else
  // matches nothing, so the caller gets the same 404 as for an id that does not exist.
  const { count } = await prisma.savedRecipient.deleteMany({
    where: { id: recipientId, ownerUserId },
  });

  if (count === 0) {
    throw new AppError(404, 'Penerima tidak ditemukan di daftar Anda.');
  }
}

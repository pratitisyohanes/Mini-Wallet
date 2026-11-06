import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { BCRYPT_SALT_ROUNDS } from '../config/constants.js';
import { prisma } from '../lib/prisma.js';
import { AppError, validationError } from '../utils/AppError.js';
import { signAccessToken } from '../utils/token.js';

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  phone: true,
  createdAt: true,
};

/** Throws a 422 listing every field (username, email, phone) that is already taken. */
async function assertIdentityAvailable({ username, email, phone }) {
  const existingUsers = await prisma.user.findMany({
    where: { OR: [{ username }, { email }, { phone }] },
    select: { username: true, email: true, phone: true },
  });

  const errors = [];
  if (existingUsers.some((user) => user.username === username)) {
    errors.push({ field: 'username', message: 'Username sudah digunakan.' });
  }
  if (existingUsers.some((user) => user.email === email)) {
    errors.push({ field: 'email', message: 'Email sudah terdaftar.' });
  }
  if (existingUsers.some((user) => user.phone === phone)) {
    errors.push({ field: 'phone', message: 'Nomor HP sudah terdaftar.' });
  }

  if (errors.length > 0) {
    throw validationError(errors);
  }
}

function isUniqueConstraintError(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function registerUser({ username, email, phone, password }) {
  await assertIdentityAvailable({ username, email, phone });

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    // The nested create runs in one database transaction: no user is left without a wallet.
    return await prisma.user.create({
      data: { username, email, phone, passwordHash, wallet: { create: {} } },
      select: publicUserSelect,
    });
  } catch (error) {
    // Another request registered the same identity between the check and the insert.
    if (isUniqueConstraintError(error)) {
      await assertIdentityAvailable({ username, email, phone });
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...publicUserSelect, passwordHash: true },
  });

  const isPasswordValid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!isPasswordValid) {
    throw new AppError(401, 'Email atau password salah.');
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return { user: publicUser, token: signAccessToken(user.id) };
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError(401, 'Akun tidak ditemukan. Silakan login kembali.');
  }

  return user;
}

import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { SUMMARY_DAYS } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';
import { findUserByIdentifier } from './user.service.js';

const walletSelect = {
  id: true,
  balance: true,
  updatedAt: true,
};

const transactionSelect = {
  id: true,
  type: true,
  amount: true,
  balanceBefore: true,
  balanceAfter: true,
  referenceId: true,
  description: true,
  createdAt: true,
  counterpartyWallet: {
    select: { user: { select: { username: true, email: true } } },
  },
};

export async function getWalletByUserId(userId) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: walletSelect,
  });

  if (!wallet) {
    throw new AppError(404, 'Wallet tidak ditemukan.');
  }

  return wallet;
}

export async function topUp(userId, amount) {
  const amountValue = BigInt(amount);

  return prisma.$transaction(async (tx) => {
    // `increment` is a single atomic UPDATE, so concurrent top-ups cannot overwrite each other.
    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: amountValue } },
      select: walletSelect,
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'TOPUP',
        amount: amountValue,
        balanceBefore: wallet.balance - amountValue,
        balanceAfter: wallet.balance,
        referenceId: randomUUID(),
        description: 'Top up saldo',
      },
      select: transactionSelect,
    });

    return { wallet, transaction };
  });
}

/**
 * Locks the wallets of the given users until the transaction ends (SELECT ... FOR UPDATE).
 * Rows are always locked in id order, so two opposite transfers (A to B and B to A)
 * running at the same time cannot deadlock.
 */
async function lockWalletsByUserIds(tx, userIds) {
  return tx.$queryRaw`
    SELECT id, user_id AS "userId", balance
    FROM wallets
    WHERE user_id = ANY(${userIds}::uuid[])
    ORDER BY id
    FOR UPDATE
  `;
}

export async function transfer(senderUserId, { recipient, amount, note }) {
  const recipientUser = await findUserByIdentifier(recipient);

  if (!recipientUser) {
    throw new AppError(404, 'Penerima tidak ditemukan.');
  }
  if (recipientUser.id === senderUserId) {
    throw new AppError(400, 'Tidak dapat transfer ke akun sendiri.');
  }

  const amountValue = BigInt(amount);

  // Every step below runs in one database transaction. Any thrown error rolls back
  // all of them, so money can never leave the sender without reaching the recipient.
  return prisma.$transaction(async (tx) => {
    const lockedWallets = await lockWalletsByUserIds(tx, [senderUserId, recipientUser.id]);
    const senderWallet = lockedWallets.find((wallet) => wallet.userId === senderUserId);
    const recipientWallet = lockedWallets.find((wallet) => wallet.userId === recipientUser.id);

    if (!senderWallet || !recipientWallet) {
      throw new AppError(404, 'Wallet tidak ditemukan.');
    }
    if (senderWallet.balance < amountValue) {
      throw new AppError(400, 'Saldo tidak cukup.');
    }

    const senderBalanceAfter = senderWallet.balance - amountValue;
    const recipientBalanceAfter = recipientWallet.balance + amountValue;
    const referenceId = randomUUID();
    const description = note || null;

    const updatedSenderWallet = await tx.wallet.update({
      where: { id: senderWallet.id },
      data: { balance: senderBalanceAfter },
      select: walletSelect,
    });

    await tx.wallet.update({
      where: { id: recipientWallet.id },
      data: { balance: recipientBalanceAfter },
    });

    const outgoingTransaction = await tx.transaction.create({
      data: {
        walletId: senderWallet.id,
        type: 'TRANSFER_OUT',
        amount: amountValue,
        balanceBefore: senderWallet.balance,
        balanceAfter: senderBalanceAfter,
        counterpartyWalletId: recipientWallet.id,
        referenceId,
        description,
      },
      select: transactionSelect,
    });

    await tx.transaction.create({
      data: {
        walletId: recipientWallet.id,
        type: 'TRANSFER_IN',
        amount: amountValue,
        balanceBefore: recipientWallet.balance,
        balanceAfter: recipientBalanceAfter,
        counterpartyWalletId: senderWallet.id,
        referenceId,
        description,
      },
    });

    return { wallet: updatedSenderWallet, transaction: outgoingTransaction };
  });
}

export async function listTransactions(userId, { page, limit, type }) {
  const wallet = await getWalletByUserId(userId);

  // Scoped by the authenticated user's wallet, so one user can never read another's history.
  const where = { walletId: wallet.id, ...(type && { type }) };

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: transactionSelect,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Jakarta has no daylight saving, so a fixed +7 hour offset gives the local calendar day.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toJakartaDateKey(date) {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Totals for the dashboard: all-time money in and out, plus a per-day breakdown
 * of the last `days` days (Asia/Jakarta calendar days, oldest first, empty days included).
 */
export async function getSummary(userId, { days = SUMMARY_DAYS, now = new Date() } = {}) {
  const wallet = await getWalletByUserId(userId);

  // Midnight in Jakarta, `days - 1` days ago, expressed in UTC.
  const todayStartUtc =
    Math.floor((now.getTime() + JAKARTA_OFFSET_MS) / DAY_MS) * DAY_MS - JAKARTA_OFFSET_MS;
  const rangeStart = new Date(todayStartUtc - (days - 1) * DAY_MS);

  const [totalsByType, recentTransactions] = await prisma.$transaction([
    prisma.transaction.groupBy({
      by: ['type'],
      where: { walletId: wallet.id },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { walletId: wallet.id, createdAt: { gte: rangeStart } },
      select: { type: true, amount: true, createdAt: true },
    }),
  ]);

  const sumOf = (type) =>
    Number(totalsByType.find((row) => row.type === type)?._sum.amount ?? 0n);

  const dailyByDate = new Map();
  for (let index = 0; index < days; index += 1) {
    const dateKey = toJakartaDateKey(new Date(rangeStart.getTime() + index * DAY_MS));
    dailyByDate.set(dateKey, { date: dateKey, moneyIn: 0, moneyOut: 0 });
  }
  for (const transaction of recentTransactions) {
    const day = dailyByDate.get(toJakartaDateKey(transaction.createdAt));
    if (!day) continue;
    if (transaction.type === 'TRANSFER_OUT') day.moneyOut += Number(transaction.amount);
    else day.moneyIn += Number(transaction.amount);
  }

  return {
    balance: Number(wallet.balance),
    totalIn: sumOf('TOPUP') + sumOf('TRANSFER_IN'),
    totalOut: sumOf('TRANSFER_OUT'),
    daily: [...dailyByDate.values()],
  };
}

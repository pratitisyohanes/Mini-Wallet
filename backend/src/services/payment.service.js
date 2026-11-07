import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import {
  createSnapTransaction,
  getTransactionStatus,
  isValidNotificationSignature,
} from '../lib/midtrans.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { creditWallet, getWalletByUserId } from './wallet.service.js';

function ensureMidtransEnabled() {
  if (!env.midtrans.enabled) {
    throw new AppError(503, 'Pembayaran online belum diaktifkan.');
  }
}

/** Maps a Midtrans transaction_status (and fraud_status for cards) to our payment status. */
export function mapMidtransStatus({ transaction_status: transactionStatus, fraud_status: fraudStatus }) {
  switch (transactionStatus) {
    case 'settlement':
      return 'PAID';
    case 'capture':
      if (fraudStatus === 'accept') return 'PAID';
      if (fraudStatus === 'deny') return 'FAILED';
      return 'PENDING'; // "challenge": Midtrans is still reviewing the card payment.
    case 'deny':
    case 'cancel':
    case 'failure':
      return 'FAILED';
    case 'expire':
      return 'EXPIRED';
    default:
      return 'PENDING';
  }
}

/**
 * Creates a PENDING payment and a Snap transaction for it.
 * The wallet is not touched here: money arrives only through applyMidtransStatus.
 */
export async function createTopUpPayment(userId, amount) {
  ensureMidtransEnabled();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { username: true, email: true, phone: true },
  });

  const id = randomUUID();
  const orderId = `MW-${id}`;
  await prisma.payment.create({ data: { id, orderId, userId, amount: BigInt(amount) } });

  try {
    const { redirectUrl } = await createSnapTransaction({
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [{ id: 'TOPUP', name: 'Top up saldo Mini-Wallet', price: amount, quantity: 1 }],
      customer_details: { first_name: user.username, email: user.email, phone: user.phone },
      callbacks: { finish: `${env.appUrl}/topup/status` },
    });

    return await prisma.payment.update({ where: { id }, data: { redirectUrl } });
  } catch (error) {
    await prisma.payment.update({ where: { id }, data: { status: 'FAILED' } });
    throw error;
  }
}

/**
 * Applies a status read from Midtrans to our payment. Safe to call any number of times
 * for the same order: only the call that moves the payment out of PENDING credits the wallet.
 * Returns the updated payment, or null when the order is not ours.
 */
export async function applyMidtransStatus(status) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId: status.order_id } });

    if (!payment) return null;
    if (payment.status !== 'PENDING') return payment;

    if (Number(status.gross_amount) !== Number(payment.amount)) {
      console.error(
        `Midtrans amount mismatch for ${payment.orderId}: expected ${payment.amount}, got ${status.gross_amount}`,
      );
      throw new AppError(400, 'Nominal pembayaran tidak sesuai.');
    }

    const nextStatus = mapMidtransStatus(status);
    const details = {
      paymentType: status.payment_type ?? null,
      midtransTransactionId: status.transaction_id ?? null,
    };

    if (nextStatus === 'PENDING') {
      return tx.payment.update({ where: { id: payment.id }, data: details });
    }

    // The status filter makes this UPDATE the guard against double credits: when two
    // notifications race, the second one waits for the first to commit and then matches no row.
    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { ...details, status: nextStatus, paidAt: nextStatus === 'PAID' ? new Date() : null },
    });

    if (count === 1 && nextStatus === 'PAID') {
      await creditWallet(tx, payment.userId, payment.amount, {
        referenceId: payment.id,
        description: 'Top up via Midtrans',
      });
    }

    return tx.payment.findUnique({ where: { id: payment.id } });
  });
}

/**
 * Handles an HTTP notification from Midtrans. The body is only trusted for its order id:
 * after the signature check, the real status is read back from the Midtrans API.
 */
export async function handleNotification(body) {
  ensureMidtransEnabled();

  if (!isValidNotificationSignature(body ?? {})) {
    throw new AppError(403, 'Signature notifikasi tidak valid.');
  }

  const status = await getTransactionStatus(body.order_id);
  if (!status) return { processed: false };

  const payment = await applyMidtransStatus(status);
  return { processed: Boolean(payment) };
}

/**
 * Returns one of the user's payments. While it is still PENDING, the status is refreshed
 * from Midtrans, so the status page works even if a notification is late or missing.
 */
export async function getPaymentForUser(userId, orderId) {
  let payment = await prisma.payment.findFirst({ where: { orderId, userId } });

  if (!payment) {
    throw new AppError(404, 'Pembayaran tidak ditemukan.');
  }

  if (payment.status === 'PENDING' && env.midtrans.enabled) {
    try {
      const status = await getTransactionStatus(orderId);
      if (status) payment = (await applyMidtransStatus(status)) ?? payment;
    } catch (error) {
      // The stored status is still correct, just not refreshed. The next poll tries again.
      console.error(`Could not refresh payment ${orderId}:`, error.message);
    }
  }

  const wallet = payment.status === 'PAID' ? await getWalletByUserId(userId) : null;
  return { payment, wallet };
}

import { MIN_PAYMENT_AMOUNT } from '../config/constants.js';
import { env } from '../config/env.js';
import * as paymentService from '../services/payment.service.js';
import { sendSuccess } from '../utils/response.js';
import { toPaymentDto, toWalletDto } from '../utils/serializers.js';

/** Tells the frontend which top-up options are available. */
export function getConfig(req, res) {
  sendSuccess(res, {
    message: 'Konfigurasi pembayaran berhasil diambil.',
    data: {
      midtransEnabled: env.midtrans.enabled,
      directTopUpEnabled: env.allowDirectTopUp,
      minAmount: MIN_PAYMENT_AMOUNT,
    },
  });
}

export async function createTopUp(req, res) {
  const payment = await paymentService.createTopUpPayment(req.user.id, req.validated.amount);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Pembayaran dibuat. Lanjutkan ke halaman pembayaran.',
    data: { payment: toPaymentDto(payment) },
  });
}

export async function getPayment(req, res) {
  const { payment, wallet } = await paymentService.getPaymentForUser(req.user.id, req.params.orderId);

  sendSuccess(res, {
    message: 'Status pembayaran berhasil diambil.',
    data: { payment: toPaymentDto(payment), wallet: wallet ? toWalletDto(wallet) : null },
  });
}

/** Called by Midtrans servers, not by the browser, so it has no login check. */
export async function handleMidtransNotification(req, res) {
  const result = await paymentService.handleNotification(req.body);

  sendSuccess(res, { message: 'Notifikasi diterima.', data: result });
}

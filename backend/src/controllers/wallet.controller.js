import * as walletService from '../services/wallet.service.js';
import { sendSuccess } from '../utils/response.js';
import { toTransactionDto, toWalletDto } from '../utils/serializers.js';

export async function getWallet(req, res) {
  const wallet = await walletService.getWalletByUserId(req.user.id);

  sendSuccess(res, {
    message: 'Saldo berhasil diambil.',
    data: { wallet: toWalletDto(wallet) },
  });
}

export async function topUp(req, res) {
  const { wallet, transaction } = await walletService.topUp(req.user.id, req.validated.amount);

  sendSuccess(res, {
    message: 'Top up berhasil.',
    data: { wallet: toWalletDto(wallet), transaction: toTransactionDto(transaction) },
  });
}

export async function transfer(req, res) {
  const { wallet, transaction } = await walletService.transfer(req.user.id, req.validated);

  sendSuccess(res, {
    message: 'Transfer berhasil.',
    data: { wallet: toWalletDto(wallet), transaction: toTransactionDto(transaction) },
  });
}

export async function listTransactions(req, res) {
  const { transactions, pagination } = await walletService.listTransactions(
    req.user.id,
    req.validated,
  );

  sendSuccess(res, {
    message: 'Riwayat transaksi berhasil diambil.',
    data: { transactions: transactions.map(toTransactionDto), pagination },
  });
}

export async function getSummary(req, res) {
  const summary = await walletService.getSummary(req.user.id);

  sendSuccess(res, {
    message: 'Ringkasan wallet berhasil diambil.',
    data: { summary },
  });
}

import { useEffect, useState } from 'react';
import { parseApiError } from '../api/client.js';
import * as paymentsApi from '../api/payments.api.js';
import * as walletApi from '../api/wallet.api.js';
import { useSubmitAction } from '../hooks/useSubmitAction.js';
import { formatRupiah } from '../utils/format.js';
import { getAmountError } from '../validators/amount.js';
import Alert from './Alert.jsx';
import Spinner from './Spinner.jsx';
import SubmitButton from './SubmitButton.jsx';
import TextField from './TextField.jsx';

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000, 1_000_000];

/**
 * With Midtrans enabled, the form creates an order and sends the user to the Midtrans
 * payment page; the balance changes only after Midtrans confirms the payment.
 * Without Midtrans it falls back to the instant demo top-up.
 */
export default function TopUpForm({ onSuccess }) {
  const [config, setConfig] = useState(null);
  const [amount, setAmount] = useState('');
  const [isAmountTouched, setIsAmountTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isActive = true;
    paymentsApi
      .getPaymentConfig()
      .then((value) => isActive && setConfig(value))
      .catch(() => isActive && setConfig({ midtransEnabled: false, directTopUpEnabled: true, minAmount: 0 }));
    return () => {
      isActive = false;
    };
  }, []);

  const usesMidtrans = Boolean(config?.midtransEnabled);
  const minAmount = usesMidtrans ? config.minAmount : 0;

  let amountError = getAmountError(amount);
  if (!amountError && Number(amount) < minAmount) {
    amountError = `Nominal minimal ${formatRupiah(minAmount)} untuk pembayaran online.`;
  }

  const { run: submitTopUp, isSubmitting } = useSubmitAction(async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (usesMidtrans) {
        const payment = await paymentsApi.createTopUpPayment(amount.trim());
        paymentsApi.rememberPendingOrder(payment.orderId);
        window.location.assign(payment.redirectUrl);
        return;
      }

      const { wallet, transaction } = await walletApi.topUp(amount.trim());
      setAmount('');
      setIsAmountTouched(false);
      setSuccessMessage(`Top up ${formatRupiah(transaction.amount)} berhasil.`);
      onSuccess(wallet.balance);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      setErrorMessage(fieldErrors.amount ?? message);
    }
  });

  function handleSubmit(event) {
    event.preventDefault();
    setIsAmountTouched(true);
    if (!amountError) submitTopUp();
  }

  function selectQuickAmount(value) {
    setAmount(String(value));
    setIsAmountTouched(true);
  }

  if (!config) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Spinner /> Memuat metode top up...
      </div>
    );
  }

  if (!usesMidtrans && !config.directTopUpEnabled) {
    return <Alert>Top up sedang tidak tersedia. Silakan coba lagi nanti.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <h2 id="topup-title" className="text-lg font-semibold">Top up saldo</h2>
        <p className="text-sm text-slate-500">
          {usesMidtrans
            ? 'Bayar lewat transfer bank, QRIS, atau e-wallet. Saldo bertambah setelah pembayaran berhasil.'
            : 'Tambahkan saldo ke dompet Anda.'}
        </p>
      </div>
      <TextField
        id="topup-amount"
        label="Nominal (Rp)"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Contoh: 100000"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        onBlur={() => setIsAmountTouched(true)}
        error={isAmountTouched || amount ? amountError : null}
        hint={
          usesMidtrans
            ? `Angka bulat tanpa titik. Minimal ${formatRupiah(minAmount)}.`
            : 'Angka bulat tanpa titik atau simbol.'
        }
      />
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => selectQuickAmount(value)}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-600 hover:text-brand-600"
          >
            {formatRupiah(value)}
          </button>
        ))}
      </div>
      <Alert>{errorMessage}</Alert>
      <Alert variant="success">{successMessage}</Alert>
      <SubmitButton
        isSubmitting={isSubmitting}
        disabled={Boolean(amountError)}
        loadingText={usesMidtrans ? 'Menyiapkan pembayaran...' : 'Memproses...'}
      >
        {usesMidtrans ? 'Lanjut ke pembayaran' : 'Top up'}
      </SubmitButton>
    </form>
  );
}

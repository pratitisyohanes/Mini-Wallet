import { useState } from 'react';
import { parseApiError } from '../api/client.js';
import * as walletApi from '../api/wallet.api.js';
import { useSubmitAction } from '../hooks/useSubmitAction.js';
import { formatRupiah } from '../utils/format.js';
import { getAmountError } from '../validators/amount.js';
import Alert from './Alert.jsx';
import SubmitButton from './SubmitButton.jsx';
import TextField from './TextField.jsx';

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000, 1_000_000];

export default function TopUpForm({ onSuccess }) {
  const [amount, setAmount] = useState('');
  const [isAmountTouched, setIsAmountTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const amountError = getAmountError(amount);

  const { run: submitTopUp, isSubmitting } = useSubmitAction(async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
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

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <h2 id="topup-title" className="text-lg font-semibold">Top up saldo</h2>
        <p className="text-sm text-slate-500">Tambahkan saldo ke dompet Anda.</p>
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
        hint="Angka bulat tanpa titik atau simbol."
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
      <SubmitButton isSubmitting={isSubmitting} disabled={Boolean(amountError)}>
        Top up
      </SubmitButton>
    </form>
  );
}

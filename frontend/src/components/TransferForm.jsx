import { useState } from 'react';
import { Link } from 'react-router-dom';
import { parseApiError } from '../api/client.js';
import * as walletApi from '../api/wallet.api.js';
import { MAX_TRANSACTION_AMOUNT } from '../config/constants.js';
import { useRecipients } from '../hooks/useRecipients.js';
import { useSubmitAction } from '../hooks/useSubmitAction.js';
import { formatDateTime, formatRupiah, shortReference } from '../utils/format.js';
import { getAmountError } from '../validators/amount.js';
import { getRecipientError } from '../validators/auth.js';
import AddRecipientForm from './AddRecipientForm.jsx';
import Alert from './Alert.jsx';
import RecipientPicker, { recipientDisplayName } from './RecipientPicker.jsx';
import SubmitButton from './SubmitButton.jsx';
import TextField from './TextField.jsx';

const INITIAL_VALUES = { recipient: '', amount: '', note: '' };
const BALANCE_SHARES = [
  { label: '25%', share: 0.25 },
  { label: '50%', share: 0.5 },
  { label: '75%', share: 0.75 },
  { label: 'Maks', share: 1 },
];

function SummaryRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

/**
 * Transfer in three steps: fill the form, review the details, then see a receipt.
 * The review step gives the user one last look before money leaves the wallet.
 */
export default function TransferForm({ balance, onSuccess }) {
  const [step, setStep] = useState('form');
  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState({});
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [saveCounterpartyError, setSaveCounterpartyError] = useState('');

  const recipients = useRecipients();
  const selectedRecipient = recipients.findByEmail(values.recipient);

  const amountNumber = Number(values.amount);
  const isOverBalance = balance !== null && !getAmountError(values.amount) && amountNumber > balance;
  const clientErrors = {
    recipient: getRecipientError(values.recipient),
    amount: getAmountError(values.amount) ?? (isOverBalance ? 'Saldo tidak cukup untuk nominal ini.' : null),
  };
  const isFormValid = !clientErrors.recipient && !clientErrors.amount;

  const visibleError = (field) =>
    serverFieldErrors[field] ?? (touched[field] || values[field] ? clientErrors[field] : null);

  const { run: submitTransfer, isSubmitting } = useSubmitAction(async () => {
    setErrorMessage('');
    setServerFieldErrors({});
    try {
      const { wallet, transaction } = await walletApi.transfer({
        recipient: values.recipient.trim(),
        amount: values.amount.trim(),
        note: values.note.trim(),
      });
      setReceipt({
        transaction,
        balanceAfter: wallet.balance,
        isSaved: Boolean(recipients.findByEmail(transaction.counterparty.email)),
      });
      setStep('done');
      onSuccess(wallet.balance);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      setServerFieldErrors(fieldErrors);
      setErrorMessage(message);
      setStep('form');
    }
  });

  const { run: saveCounterparty, isSubmitting: isSavingCounterparty } = useSubmitAction(async () => {
    setSaveCounterpartyError('');
    try {
      await recipients.addRecipient({ identifier: receipt.transaction.counterparty.email });
      setReceipt((current) => ({ ...current, isSaved: true }));
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      setSaveCounterpartyError(fieldErrors.identifier ?? message);
    }
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setServerFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleBlur(event) {
    setTouched((current) => ({ ...current, [event.target.name]: true }));
  }

  function handleSelectRecipient(recipient) {
    setValues((current) => ({ ...current, recipient: recipient.email }));
    setServerFieldErrors((current) => ({ ...current, recipient: undefined }));
    setErrorMessage('');
  }

  function handleRecipientAdded(recipient) {
    setIsAddingRecipient(false);
    setInfoMessage(`${recipientDisplayName(recipient)} disimpan ke daftar penerima.`);
    handleSelectRecipient(recipient);
  }

  function fillShareOfBalance(share) {
    const amount = Math.min(Math.floor(balance * share), MAX_TRANSACTION_AMOUNT);
    setValues((current) => ({ ...current, amount: String(amount) }));
    setTouched((current) => ({ ...current, amount: true }));
    setServerFieldErrors((current) => ({ ...current, amount: undefined }));
  }

  function handleReview(event) {
    event.preventDefault();
    setTouched({ recipient: true, amount: true });
    setInfoMessage('');
    if (isFormValid) setStep('review');
  }

  function startNewTransfer() {
    setValues(INITIAL_VALUES);
    setTouched({});
    setReceipt(null);
    setSaveCounterpartyError('');
    setErrorMessage('');
    setStep('form');
  }

  if (step === 'done' && receipt) {
    const { transaction, balanceAfter, isSaved } = receipt;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-2xl text-brand-600" aria-hidden="true">
            ✓
          </span>
          <h2 className="text-lg font-semibold" role="status">Transfer berhasil</h2>
          <p className="text-3xl font-bold tabular-nums text-slate-900">{formatRupiah(transaction.amount)}</p>
        </div>
        <dl className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
          <SummaryRow label="Penerima">
            {transaction.counterparty.username}
            <div className="text-xs font-normal text-slate-500">{transaction.counterparty.email}</div>
          </SummaryRow>
          {transaction.description && <SummaryRow label="Catatan">{transaction.description}</SummaryRow>}
          <SummaryRow label="Waktu">{formatDateTime(transaction.createdAt)}</SummaryRow>
          <SummaryRow label="No. referensi">
            <span className="font-mono">{shortReference(transaction.referenceId)}</span>
          </SummaryRow>
          <SummaryRow label="Sisa saldo">{formatRupiah(balanceAfter)}</SummaryRow>
        </dl>
        {!isSaved && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={saveCounterparty}
              disabled={isSavingCounterparty}
              className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60"
            >
              {isSavingCounterparty
                ? 'Menyimpan...'
                : `Simpan ${transaction.counterparty.username} ke daftar penerima`}
            </button>
            <Alert>{saveCounterpartyError}</Alert>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/transactions"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Lihat riwayat
          </Link>
          <button
            type="button"
            onClick={startNewTransfer}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Transfer lagi
          </button>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Periksa sebelum mengirim</h2>
          <p className="text-sm text-slate-500">Transfer tidak bisa dibatalkan setelah dikirim.</p>
        </div>
        <dl className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
          <SummaryRow label="Penerima">
            {selectedRecipient ? recipientDisplayName(selectedRecipient) : values.recipient.trim()}
            {selectedRecipient && (
              <div className="text-xs font-normal text-slate-500">{selectedRecipient.email}</div>
            )}
          </SummaryRow>
          <SummaryRow label="Nominal">{formatRupiah(amountNumber)}</SummaryRow>
          {values.note.trim() && <SummaryRow label="Catatan">{values.note.trim()}</SummaryRow>}
          {balance !== null && (
            <SummaryRow label="Sisa saldo setelah transfer">{formatRupiah(balance - amountNumber)}</SummaryRow>
          )}
        </dl>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStep('form')}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Ubah
          </button>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitTransfer();
            }}
          >
            <SubmitButton isSubmitting={isSubmitting} loadingText="Mengirim...">
              Kirim sekarang
            </SubmitButton>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Kirim uang</h2>
        <p className="text-sm text-slate-500">Ke sesama pengguna Mini Wallet lewat email atau nomor HP.</p>
      </div>

      <RecipientPicker
        recipients={recipients.recipients}
        isLoading={recipients.isLoading}
        loadError={recipients.loadError}
        selectedId={selectedRecipient?.id}
        onSelect={handleSelectRecipient}
        onRemove={recipients.removeRecipient}
        onAddClick={() => setIsAddingRecipient(true)}
      />

      {/* A separate form, outside the transfer form: HTML does not allow nested forms. */}
      {isAddingRecipient && (
        <AddRecipientForm
          onAdd={recipients.addRecipient}
          onAdded={handleRecipientAdded}
          onCancel={() => setIsAddingRecipient(false)}
        />
      )}

      <form onSubmit={handleReview} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <TextField
            id="recipient"
            label="Email atau nomor HP penerima"
            autoComplete="off"
            placeholder="yohanes@example.com / 081234567890"
            value={values.recipient}
            onChange={handleChange}
            onBlur={handleBlur}
            error={visibleError('recipient')}
          />
          {selectedRecipient && (
            <p className="text-xs text-brand-700">
              Akan dikirim ke <strong>{selectedRecipient.username}</strong>
              {selectedRecipient.alias && ` (${selectedRecipient.alias})`}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <TextField
            id="amount"
            label="Nominal (Rp)"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Contoh: 25000"
            value={values.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            error={visibleError('amount')}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Isi cepat dari saldo:</span>
            {BALANCE_SHARES.map(({ label, share }) => (
              <button
                key={label}
                type="button"
                onClick={() => fillShareOfBalance(share)}
                disabled={!balance}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-600 hover:text-brand-600 disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <TextField
          id="note"
          label="Catatan (opsional)"
          maxLength={100}
          placeholder="Contoh: Bayar makan siang"
          value={values.note}
          onChange={handleChange}
          error={serverFieldErrors.note}
        />
        <Alert>{errorMessage}</Alert>
        <Alert variant="success">{infoMessage}</Alert>
        <SubmitButton isSubmitting={false} disabled={!isFormValid}>
          Lanjutkan
        </SubmitButton>
      </form>
    </div>
  );
}

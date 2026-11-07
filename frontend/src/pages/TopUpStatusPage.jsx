import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { parseApiError } from '../api/client.js';
import * as paymentsApi from '../api/payments.api.js';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { useWalletContext } from '../context/WalletContext.jsx';
import { formatRupiah } from '../utils/format.js';

const POLL_INTERVAL_MS = 3000;
const MAX_AUTO_POLLS = 40; // About two minutes, then the user checks manually.

const STATUS_VIEW = {
  PENDING: {
    title: 'Menunggu pembayaran',
    text: 'Selesaikan pembayaran di halaman Midtrans. Halaman ini akan diperbarui otomatis.',
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  PAID: {
    title: 'Top up berhasil',
    text: 'Pembayaran diterima dan saldo Anda sudah bertambah.',
    tone: 'border-brand-100 bg-brand-50 text-brand-700',
  },
  FAILED: {
    title: 'Pembayaran gagal',
    text: 'Pembayaran ditolak atau dibatalkan. Saldo Anda tidak berubah.',
    tone: 'border-red-200 bg-red-50 text-red-700',
  },
  EXPIRED: {
    title: 'Pembayaran kedaluwarsa',
    text: 'Batas waktu pembayaran sudah lewat. Saldo Anda tidak berubah.',
    tone: 'border-red-200 bg-red-50 text-red-700',
  },
};

/** Midtrans sends the user here after the payment page, with ?order_id=... in the URL. */
export default function TopUpStatusPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') ?? paymentsApi.readPendingOrder();
  const { handleTransactionCompleted, openTopUp } = useWalletContext();

  const [payment, setPayment] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const hasReportedPaid = useRef(false);

  const checkStatus = useCallback(async () => {
    if (!orderId) return;
    setIsChecking(true);
    try {
      const { payment: latest, wallet } = await paymentsApi.getPayment(orderId);
      setPayment(latest);
      setErrorMessage('');
      if (latest.status === 'PAID' && wallet && !hasReportedPaid.current) {
        hasReportedPaid.current = true;
        handleTransactionCompleted(wallet.balance);
      }
    } catch (error) {
      setErrorMessage(parseApiError(error).message);
    } finally {
      setIsChecking(false);
      setPollCount((count) => count + 1);
    }
  }, [orderId, handleTransactionCompleted]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const isPending = !payment || payment.status === 'PENDING';
  const keepsPolling = isPending && pollCount > 0 && pollCount < MAX_AUTO_POLLS && !errorMessage;

  useEffect(() => {
    if (!keepsPolling) return undefined;
    const timer = setTimeout(checkStatus, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [keepsPolling, pollCount, checkStatus]);

  if (!orderId) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Status top up</h1>
        <Alert>Nomor pesanan tidak ditemukan. Cek riwayat transaksi untuk melihat top up Anda.</Alert>
        <Link to="/transactions" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Buka riwayat transaksi
        </Link>
      </div>
    );
  }

  const view = payment ? STATUS_VIEW[payment.status] : null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Status top up</h1>
        <p className="text-sm text-slate-500 break-all">Pesanan {orderId}</p>
      </div>

      <Alert>{errorMessage}</Alert>

      {!payment && !errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          <Spinner /> Memeriksa status pembayaran...
        </div>
      )}

      {payment && view && (
        <div className={`flex flex-col gap-3 rounded-2xl border p-5 ${view.tone}`} role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{view.title}</h2>
            {payment.status === 'PENDING' && isChecking && <Spinner />}
          </div>
          <p className="text-sm">{view.text}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="opacity-75">Nominal</dt>
            <dd className="font-semibold tabular-nums">{formatRupiah(payment.amount)}</dd>
            {payment.paymentType && (
              <>
                <dt className="opacity-75">Metode</dt>
                <dd>{payment.paymentType.replaceAll('_', ' ')}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {payment?.status === 'PENDING' && payment.redirectUrl && (
          <a
            href={payment.redirectUrl}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Lanjutkan pembayaran
          </a>
        )}
        {isPending && !keepsPolling && (
          <button
            type="button"
            onClick={checkStatus}
            disabled={isChecking}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cek status lagi
          </button>
        )}
        {(payment?.status === 'FAILED' || payment?.status === 'EXPIRED') && (
          <button
            type="button"
            onClick={openTopUp}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Top up lagi
          </button>
        )}
        <Link
          to="/dashboard"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ke dashboard
        </Link>
      </div>
    </div>
  );
}

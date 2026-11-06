import Alert from '../components/Alert.jsx';
import { EyeIcon, EyeOffIcon, PlusIcon, WalletIcon } from '../components/Icons.jsx';
import Money from '../components/Money.jsx';
import TransferForm from '../components/TransferForm.jsx';
import { useWalletContext } from '../context/WalletContext.jsx';

export default function TransferPage() {
  const { balance, loadError, isBalanceHidden, toggleBalanceHidden, openTopUp, handleTransactionCompleted } =
    useWalletContext();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transfer</h1>
        <p className="text-sm text-slate-500">Kirim saldo ke sesama pengguna secara instan.</p>
      </div>

      <Alert>{loadError}</Alert>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600" aria-hidden="true">
              <WalletIcon />
            </span>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                Saldo tersedia
                <button
                  type="button"
                  onClick={toggleBalanceHidden}
                  aria-pressed={isBalanceHidden}
                  aria-label={isBalanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                  className="rounded p-0.5 hover:text-slate-800"
                >
                  {isBalanceHidden ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              <Money amount={balance} className="text-lg font-bold text-slate-900" />
            </div>
          </div>
          <button
            type="button"
            onClick={openTopUp}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" />
            Top up
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <TransferForm balance={balance} onSuccess={handleTransactionCompleted} />
        </div>
      </div>
    </div>
  );
}

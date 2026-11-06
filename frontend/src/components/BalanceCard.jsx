import { Link } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext.jsx';
import { EyeIcon, EyeOffIcon, PlusIcon, SendIcon } from './Icons.jsx';
import Money from './Money.jsx';

/** Main balance card: amount (hideable), owner, and the two primary actions. */
export default function BalanceCard({ username, phoneMasked }) {
  const { balance, isBalanceHidden, toggleBalanceHidden, openTopUp } = useWalletContext();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-brand-700 p-6 text-white shadow-sm">
      {/* Two soft circles as a quiet background pattern. */}
      <span aria-hidden="true" className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/5" />
      <span aria-hidden="true" className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-brand-100">Saldo tersedia</span>
          <button
            type="button"
            onClick={toggleBalanceHidden}
            aria-pressed={isBalanceHidden}
            aria-label={isBalanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            className="rounded-lg p-1.5 text-brand-100 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            {isBalanceHidden ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <Money amount={balance} className="text-3xl font-bold sm:text-4xl" />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="text-sm">
            <div className="font-semibold">{username}</div>
            {phoneMasked && <div className="text-brand-100 tabular-nums">{phoneMasked}</div>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openTopUp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              <PlusIcon className="h-4 w-4" />
              Top up
            </button>
            <Link
              to="/transfer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <SendIcon className="h-4 w-4" />
              Kirim
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

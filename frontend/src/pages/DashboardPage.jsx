import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import BalanceCard from '../components/BalanceCard.jsx';
import CashFlowChart from '../components/CashFlowChart.jsx';
import { ReceiveIcon, SendIcon } from '../components/Icons.jsx';
import Money from '../components/Money.jsx';
import Spinner from '../components/Spinner.jsx';
import TransactionItem from '../components/TransactionItem.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWalletContext } from '../context/WalletContext.jsx';
import { useTransactions } from '../hooks/useTransactions.js';
import { maskPhone } from '../utils/format.js';

const RECENT_LIMIT = 5;

function StatCard({ label, amount, hint, Icon, tone }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm text-slate-500">{label}</span>
        <Money amount={amount} className="text-xl font-bold text-slate-900" />
        <span className="text-xs text-slate-500">{hint}</span>
      </div>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`} aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { summary, loadError } = useWalletContext();
  const recent = useTransactions({ limit: RECENT_LIMIT });

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Halo, {user.username}</h1>
        <p className="text-sm text-slate-500">Ringkasan saldo dan aktivitas dompet Anda.</p>
      </div>

      <Alert>{loadError}</Alert>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <BalanceCard username={user.username} phoneMasked={maskPhone(user.phone)} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label="Total uang masuk"
            amount={summary?.totalIn ?? null}
            hint="Top up dan transfer masuk"
            Icon={ReceiveIcon}
            tone="bg-brand-50 text-brand-600"
          />
          <StatCard
            label="Total uang keluar"
            amount={summary?.totalOut ?? null}
            hint="Transfer ke akun lain"
            Icon={SendIcon}
            tone="bg-red-50 text-red-600"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {summary ? (
          <CashFlowChart daily={summary.daily} />
        ) : (
          <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-400">
            <Spinner className="h-5 w-5" />
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Transaksi terakhir</h2>
            <Link to="/transactions" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Lihat semua
            </Link>
          </div>
          <Alert>{recent.loadError}</Alert>
          {recent.isLoading ? (
            <Spinner className="mx-auto my-8 h-5 w-5 text-slate-400" />
          ) : recent.transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Belum ada transaksi.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

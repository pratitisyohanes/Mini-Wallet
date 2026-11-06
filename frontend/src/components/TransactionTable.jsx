import { TRANSACTION_TYPE_LABELS } from '../config/constants.js';
import { formatDateTime, shortReference } from '../utils/format.js';
import { RefreshIcon } from './Icons.jsx';
import Money from './Money.jsx';
import Spinner from './Spinner.jsx';
import TransactionItem, { SignedAmount, TypeBadge, describeTransaction } from './TransactionItem.jsx';

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Semua' },
  ...Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

/** Full history: filter chips, a table on wide screens, a list on phones, and pagination. */
export default function TransactionTable({
  transactions,
  pagination,
  typeFilter,
  isLoading,
  onPageChange,
  onTypeFilterChange,
  onReload,
}) {
  const { page, totalPages, total } = pagination;
  const isEmpty = !isLoading && transactions.length === 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tipe transaksi">
          {TYPE_FILTER_OPTIONS.map((option) => {
            const isActive = option.value === typeFilter;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onTypeFilterChange(option.value)}
                aria-pressed={isActive}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshIcon className="h-4 w-4" />
          Muat ulang
        </button>
      </div>

      {isLoading ? (
        <div className="px-5 py-10 text-slate-400">
          <Spinner className="mx-auto h-5 w-5" />
        </div>
      ) : isEmpty ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          {typeFilter ? 'Tidak ada transaksi dengan tipe ini.' : 'Belum ada transaksi. Mulai dengan top up saldo.'}
        </p>
      ) : (
        <>
          {/* Phones: a list that fits the screen without horizontal scrolling. */}
          <ul className="divide-y divide-slate-100 px-5 md:hidden">
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} showBalanceAfter />
            ))}
          </ul>

          {/* Wider screens: a statement-style table. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Transaksi</th>
                  <th className="px-5 py-3 font-medium">Keterangan</th>
                  <th className="px-5 py-3 font-medium">Waktu</th>
                  <th className="px-5 py-3 text-right font-medium">Nominal</th>
                  <th className="px-5 py-3 text-right font-medium">Saldo akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((transaction) => {
                  const { title, note } = describeTransaction(transaction);
                  return (
                    <tr key={transaction.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <TypeBadge type={transaction.type} />
                          <div>
                            <div className="font-medium whitespace-nowrap">
                              {TRANSACTION_TYPE_LABELS[transaction.type]}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {shortReference(transaction.referenceId)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div>{title}</div>
                        {note && <div className="text-xs text-slate-500">“{note}”</div>}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                        {formatDateTime(transaction.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <SignedAmount transaction={transaction} />
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap text-slate-600">
                        <Money amount={transaction.balanceAfter} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
        <span>
          {total} transaksi · Halaman {totalPages === 0 ? 0 : page} dari {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </section>
  );
}

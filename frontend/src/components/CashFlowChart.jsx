import { useWalletContext } from '../context/WalletContext.jsx';
import { formatRupiah } from '../utils/format.js';

const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'UTC' });

const CHART_HEIGHT = 140;

/** Paired bars (money in / money out) for each of the last 7 days. Plain CSS, no chart library. */
export default function CashFlowChart({ daily }) {
  const { isBalanceHidden } = useWalletContext();
  const maxAmount = Math.max(0, ...daily.flatMap((day) => [day.moneyIn, day.moneyOut]));
  const hasActivity = maxAmount > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Arus dana 7 hari</h2>
          <p className="text-sm text-slate-500">Uang masuk dan keluar per hari</p>
        </div>
        <div className="flex gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Masuk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Keluar
          </span>
        </div>
      </div>

      {!hasActivity ? (
        <p className="mt-6 rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Belum ada transaksi dalam 7 hari terakhir. Grafik akan terisi setelah Anda top up atau transfer.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-7 gap-2" style={{ height: CHART_HEIGHT + 24 }}>
          {daily.map((day) => {
            const label = dayFormatter.format(new Date(`${day.date}T00:00:00Z`));
            const tooltip = isBalanceHidden
              ? label
              : `${label}: masuk ${formatRupiah(day.moneyIn)}, keluar ${formatRupiah(day.moneyOut)}`;

            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5" title={tooltip}>
                <div className="flex w-full flex-1 items-end justify-center gap-1">
                  {[
                    ['moneyIn', 'bg-brand-600'],
                    ['moneyOut', 'bg-red-400'],
                  ].map(([field, color]) => (
                    <span
                      key={field}
                      className={`w-full max-w-4 rounded-t ${color}`}
                      style={{ height: `${Math.max((day[field] / maxAmount) * 100, day[field] ? 3 : 0)}%` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            );
          })}
        </div>
      )}
      {hasActivity && !isBalanceHidden && (
        <p className="mt-3 text-xs text-slate-500">Tertinggi dalam sehari: {formatRupiah(maxAmount)}</p>
      )}
    </section>
  );
}

import { TRANSACTION_TYPE_LABELS } from '../config/constants.js';
import { formatDateTime, shortReference } from '../utils/format.js';
import { PlusIcon, ReceiveIcon, SendIcon } from './Icons.jsx';
import Money from './Money.jsx';

const TYPE_STYLES = {
  TOPUP: { Icon: PlusIcon, badge: 'bg-brand-50 text-brand-600' },
  TRANSFER_IN: { Icon: ReceiveIcon, badge: 'bg-brand-50 text-brand-600' },
  TRANSFER_OUT: { Icon: SendIcon, badge: 'bg-red-50 text-red-600' },
};

export function describeTransaction(transaction) {
  if (transaction.type === 'TOPUP') {
    return { title: transaction.description ?? 'Top up saldo', note: null };
  }

  const direction = transaction.type === 'TRANSFER_IN' ? 'Dari' : 'Ke';
  const counterpartyName = transaction.counterparty?.username ?? 'akun yang dihapus';
  return { title: `${direction} ${counterpartyName}`, note: transaction.description };
}

export function TypeBadge({ type }) {
  const { Icon, badge } = TYPE_STYLES[type];
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${badge}`} aria-hidden="true">
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function SignedAmount({ transaction, className = '' }) {
  const isOutgoing = transaction.type === 'TRANSFER_OUT';
  return (
    <span className={`font-semibold whitespace-nowrap ${isOutgoing ? 'text-red-600' : 'text-brand-600'} ${className}`}>
      {isOutgoing ? '− ' : '+ '}
      <Money amount={transaction.amount} />
    </span>
  );
}

/** One transaction as a compact row: used on the dashboard and as the phone layout of the history page. */
export default function TransactionItem({ transaction, showBalanceAfter = false }) {
  const { title, note } = describeTransaction(transaction);

  return (
    <li className="flex items-center gap-3 py-3">
      <TypeBadge type={transaction.type} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-900">{title}</div>
        <div className="truncate text-xs text-slate-500">
          {TRANSACTION_TYPE_LABELS[transaction.type]} · {formatDateTime(transaction.createdAt)}
        </div>
        {note && <div className="truncate text-xs text-slate-500">“{note}”</div>}
        <div className="font-mono text-[11px] text-slate-400">{shortReference(transaction.referenceId)}</div>
      </div>
      <div className="flex flex-col items-end gap-0.5 text-sm">
        <SignedAmount transaction={transaction} />
        {showBalanceAfter && (
          <span className="text-xs text-slate-500">
            Saldo <Money amount={transaction.balanceAfter} />
          </span>
        )}
      </div>
    </li>
  );
}

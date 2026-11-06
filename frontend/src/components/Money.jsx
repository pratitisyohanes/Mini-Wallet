import { useWalletContext } from '../context/WalletContext.jsx';
import { formatRupiah } from '../utils/format.js';

/** A Rupiah amount that respects the "hide balance" setting. `null` shows a loading placeholder. */
export default function Money({ amount, className = '' }) {
  const { isBalanceHidden } = useWalletContext();

  let text = formatRupiah(amount ?? 0);
  if (amount === null || amount === undefined) text = 'Rp ...';
  else if (isBalanceHidden) text = 'Rp ••••••';

  return <span className={`tabular-nums ${className}`}>{text}</span>;
}

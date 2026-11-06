import Alert from '../components/Alert.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import { useTransactions } from '../hooks/useTransactions.js';

export default function TransactionsPage() {
  const history = useTransactions();

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Riwayat transaksi</h1>
        <p className="text-sm text-slate-500">Semua uang masuk dan keluar, terbaru di atas.</p>
      </div>
      <Alert>{history.loadError}</Alert>
      <TransactionTable
        transactions={history.transactions}
        pagination={history.pagination}
        typeFilter={history.typeFilter}
        isLoading={history.isLoading}
        onPageChange={history.goToPage}
        onTypeFilterChange={history.filterByType}
        onReload={history.reload}
      />
    </>
  );
}

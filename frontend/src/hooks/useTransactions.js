import { useCallback, useEffect, useState } from 'react';
import { parseApiError } from '../api/client.js';
import * as walletApi from '../api/wallet.api.js';
import { TRANSACTIONS_PAGE_SIZE } from '../config/constants.js';
import { useWalletContext } from '../context/WalletContext.jsx';

/**
 * Loads one page of transaction history. Reloads when the page or filter changes,
 * and again after any top-up or transfer (via `dataVersion`).
 */
export function useTransactions({ limit = TRANSACTIONS_PAGE_SIZE } = {}) {
  const { dataVersion } = useWalletContext();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ page: 1, type: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    walletApi
      .getTransactions({ page: filters.page, limit, type: filters.type })
      .then((result) => {
        if (!isActive) return;
        setTransactions(result.transactions);
        setPagination(result.pagination);
        setLoadError('');
      })
      .catch((error) => isActive && setLoadError(parseApiError(error).message))
      .finally(() => isActive && setIsLoading(false));

    return () => {
      isActive = false;
    };
  }, [filters, limit, dataVersion, reloadCount]);

  const goToPage = useCallback((page) => setFilters((current) => ({ ...current, page })), []);
  const filterByType = useCallback((type) => setFilters({ page: 1, type }), []);
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    transactions,
    pagination,
    typeFilter: filters.type,
    isLoading,
    loadError,
    goToPage,
    filterByType,
    reload,
  };
}

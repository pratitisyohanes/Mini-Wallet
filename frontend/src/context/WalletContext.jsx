import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { parseApiError } from '../api/client.js';
import * as walletApi from '../api/wallet.api.js';

const WalletContext = createContext(null);
const HIDE_BALANCE_KEY = 'mini-wallet:hide-balance';

function readHiddenPreference() {
  try {
    return localStorage.getItem(HIDE_BALANCE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Shared wallet state for every page behind the app layout: balance, dashboard summary,
 * the "hide balance" preference, and the top-up dialog. `dataVersion` increases after
 * every top-up or transfer so pages that list transactions know to reload.
 */
export function WalletProvider({ children }) {
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isBalanceHidden, setIsBalanceHidden] = useState(readHiddenPreference);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshSummary = useCallback(async () => {
    try {
      setSummary(await walletApi.getSummary());
      setLoadError('');
    } catch (error) {
      setLoadError(parseApiError(error).message);
    }
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  /** Called after a successful top-up or transfer with the balance the API returned. */
  const handleTransactionCompleted = useCallback(
    (newBalance) => {
      setSummary((current) => (current ? { ...current, balance: newBalance } : current));
      setDataVersion((version) => version + 1);
      refreshSummary();
    },
    [refreshSummary],
  );

  const toggleBalanceHidden = useCallback(() => {
    setIsBalanceHidden((hidden) => {
      try {
        localStorage.setItem(HIDE_BALANCE_KEY, String(!hidden));
      } catch {
        // Storage can be blocked (private mode). The toggle still works for this visit.
      }
      return !hidden;
    });
  }, []);

  const value = useMemo(
    () => ({
      summary,
      balance: summary?.balance ?? null,
      loadError,
      dataVersion,
      isBalanceHidden,
      toggleBalanceHidden,
      handleTransactionCompleted,
      isTopUpOpen,
      openTopUp: () => setIsTopUpOpen(true),
      closeTopUp: () => setIsTopUpOpen(false),
    }),
    [summary, loadError, dataVersion, isBalanceHidden, toggleBalanceHidden, handleTransactionCompleted, isTopUpOpen],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used inside <WalletProvider>.');
  }
  return context;
}

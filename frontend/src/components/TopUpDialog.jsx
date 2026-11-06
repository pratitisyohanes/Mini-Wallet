import { useEffect, useRef } from 'react';
import { useWalletContext } from '../context/WalletContext.jsx';
import { CloseIcon } from './Icons.jsx';
import TopUpForm from './TopUpForm.jsx';

/**
 * Top-up form in a native <dialog>, so it can be opened from any page.
 * The browser handles the focus trap and closes it on Escape.
 */
export default function TopUpDialog() {
  const { isTopUpOpen, closeTopUp, handleTransactionCompleted } = useWalletContext();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isTopUpOpen && !dialog.open) dialog.showModal();
    if (!isTopUpOpen && dialog.open) dialog.close();
  }, [isTopUpOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={closeTopUp}
      onClick={(event) => event.target === dialogRef.current && closeTopUp()}
      aria-labelledby="topup-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="relative p-6">
        <button
          type="button"
          onClick={closeTopUp}
          aria-label="Tutup"
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <CloseIcon />
        </button>
        {/* Remounted on every open so the form starts empty. */}
        {isTopUpOpen && <TopUpForm onSuccess={handleTransactionCompleted} />}
      </div>
    </dialog>
  );
}

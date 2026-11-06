import { useState } from 'react';
import { parseApiError } from '../api/client.js';
import Alert from './Alert.jsx';

export function recipientDisplayName(recipient) {
  return recipient.alias ?? recipient.username;
}

/**
 * Saved recipients shown as chips above the transfer form.
 * Clicking a chip fills the recipient field; the small x removes the contact.
 */
export default function RecipientPicker({
  recipients,
  isLoading,
  loadError,
  selectedId,
  onSelect,
  onRemove,
  onAddClick,
}) {
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState('');

  async function handleRemove(recipient) {
    setRemoveError('');
    setRemovingId(recipient.id);
    try {
      await onRemove(recipient.id);
    } catch (error) {
      setRemoveError(parseApiError(error).message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">Penerima tersimpan</span>
      <Alert>{loadError || removeError}</Alert>

      <div className="flex flex-wrap gap-2">
        {isLoading && <span className="text-xs text-slate-500">Memuat daftar penerima...</span>}

        {recipients.map((recipient) => {
          const isSelected = recipient.id === selectedId;
          return (
            <span
              key={recipient.id}
              className={`inline-flex items-center rounded-full border text-sm ${
                isSelected ? 'border-brand-600 bg-brand-50' : 'border-slate-300 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(recipient)}
                aria-pressed={isSelected}
                title={`${recipient.email} · ${recipient.phoneMasked}`}
                className="rounded-l-full py-1 pr-1 pl-3 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                <span className="font-medium">{recipientDisplayName(recipient)}</span>
                <span className="ml-1.5 hidden text-xs text-slate-500 sm:inline">{recipient.email}</span>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(recipient)}
                disabled={removingId === recipient.id}
                aria-label={`Hapus ${recipientDisplayName(recipient)} dari daftar penerima`}
                className="rounded-r-full px-2 py-1 text-slate-400 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50"
              >
                ×
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={onAddClick}
          className="rounded-full border border-dashed border-brand-600 px-3 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          + Tambah penerima
        </button>
      </div>

      {!isLoading && !loadError && recipients.length === 0 && (
        <p className="text-xs text-slate-500">
          Belum ada penerima tersimpan. Simpan teman yang sering Anda kirimi agar tidak perlu mengetik ulang.
        </p>
      )}
    </div>
  );
}

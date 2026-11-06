import { useState } from 'react';
import { parseApiError } from '../api/client.js';
import { useSubmitAction } from '../hooks/useSubmitAction.js';
import { getRecipientError } from '../validators/auth.js';
import Alert from './Alert.jsx';
import SubmitButton from './SubmitButton.jsx';
import TextField from './TextField.jsx';

// Must match RECIPIENT_ALIAS_MAX_LENGTH in backend/src/validators/recipient.validator.js.
const ALIAS_MAX_LENGTH = 50;

/** Small form for saving a registered user to the address book. */
export default function AddRecipientForm({ onAdd, onCancel, onAdded }) {
  const [identifier, setIdentifier] = useState('');
  const [alias, setAlias] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const identifierError = getRecipientError(identifier);
  const visibleIdentifierError =
    serverFieldErrors.identifier ?? (isTouched || identifier ? identifierError : null);

  const { run: submit, isSubmitting } = useSubmitAction(async () => {
    setErrorMessage('');
    setServerFieldErrors({});
    try {
      const recipient = await onAdd({ identifier: identifier.trim(), alias: alias.trim() });
      onAdded(recipient);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      setServerFieldErrors(fieldErrors);
      setErrorMessage(Object.keys(fieldErrors).length > 0 ? '' : message);
    }
  });

  function handleSubmit(event) {
    event.preventDefault();
    setIsTouched(true);
    if (!identifierError) submit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <h3 className="text-sm font-semibold">Tambah penerima</h3>
      <TextField
        id="newRecipientIdentifier"
        label="Email atau nomor HP"
        autoComplete="off"
        placeholder="yohanes@example.com / 081234567890"
        hint="Hanya pengguna yang sudah terdaftar di Mini Wallet."
        value={identifier}
        onChange={(event) => {
          setIdentifier(event.target.value);
          setServerFieldErrors((current) => ({ ...current, identifier: undefined }));
        }}
        onBlur={() => setIsTouched(true)}
        error={visibleIdentifierError}
      />
      <TextField
        id="newRecipientAlias"
        label="Nama panggilan (opsional)"
        autoComplete="off"
        maxLength={ALIAS_MAX_LENGTH}
        placeholder="Contoh: Budi kantor"
        value={alias}
        onChange={(event) => setAlias(event.target.value)}
        error={serverFieldErrors.alias}
      />
      <Alert>{errorMessage}</Alert>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100"
        >
          Batal
        </button>
        <SubmitButton isSubmitting={isSubmitting} disabled={Boolean(identifierError)} loadingText="Menyimpan...">
          Simpan
        </SubmitButton>
      </div>
    </form>
  );
}

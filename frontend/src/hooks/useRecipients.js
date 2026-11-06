import { useCallback, useEffect, useState } from 'react';
import { parseApiError } from '../api/client.js';
import * as recipientsApi from '../api/recipients.api.js';

/** Loads the logged-in user's saved recipients and keeps the list in sync after add/remove. */
export function useRecipients() {
  const [recipients, setRecipients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isActive = true;

    recipientsApi
      .listRecipients()
      .then((list) => isActive && setRecipients(list))
      .catch((error) => isActive && setLoadError(parseApiError(error).message))
      .finally(() => isActive && setIsLoading(false));

    return () => {
      isActive = false;
    };
  }, []);

  /** Throws the API error so the calling form can show field messages. */
  const addRecipient = useCallback(async (payload) => {
    const recipient = await recipientsApi.addRecipient(payload);
    setRecipients((current) => [recipient, ...current]);
    return recipient;
  }, []);

  const removeRecipient = useCallback(async (id) => {
    await recipientsApi.removeRecipient(id);
    setRecipients((current) => current.filter((recipient) => recipient.id !== id));
  }, []);

  /** Finds a saved recipient by the email typed in the transfer form. */
  const findByEmail = useCallback(
    (email) => {
      const value = email.trim().toLowerCase();
      return value ? recipients.find((recipient) => recipient.email === value) ?? null : null;
    },
    [recipients],
  );

  return { recipients, isLoading, loadError, addRecipient, removeRecipient, findByEmail };
}

import { useCallback, useRef, useState } from 'react';

/**
 * Wraps an async submit handler so it can only run once at a time.
 * The ref blocks a second call immediately, even before React re-renders
 * the disabled button, which stops rapid double clicks from sending
 * duplicate requests.
 */
export function useSubmitAction(action) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRunningRef = useRef(false);

  const run = useCallback(
    async (...args) => {
      if (isRunningRef.current) return undefined;

      isRunningRef.current = true;
      setIsSubmitting(true);
      try {
        return await action(...args);
      } finally {
        isRunningRef.current = false;
        setIsSubmitting(false);
      }
    },
    [action],
  );

  return { run, isSubmitting };
}

import Spinner from './Spinner.jsx';

/** Disabled while the form is invalid or a request is in flight, so it cannot be spam-clicked. */
export default function SubmitButton({ isSubmitting, disabled, loadingText = 'Memproses...', children }) {
  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting}
      aria-busy={isSubmitting}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
    >
      {isSubmitting && <Spinner />}
      {isSubmitting ? loadingText : children}
    </button>
  );
}

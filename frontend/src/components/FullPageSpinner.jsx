import Spinner from './Spinner.jsx';

export default function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-brand-600">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

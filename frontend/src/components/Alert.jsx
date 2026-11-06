const VARIANT_CLASSES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-brand-100 bg-brand-50 text-brand-700',
};

export default function Alert({ variant = 'error', children }) {
  if (!children) return null;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3 py-2 text-sm ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </div>
  );
}

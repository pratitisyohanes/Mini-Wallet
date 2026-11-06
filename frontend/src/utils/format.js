const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatRupiah(amount) {
  return rupiahFormatter.format(amount);
}

export function formatDateTime(isoString) {
  return dateTimeFormatter.format(new Date(isoString));
}

/** "081200000002" -> "0812****0002", the same masking the API uses for saved recipients. */
export function maskPhone(phone) {
  if (!phone || phone.length <= 8) return phone ?? '';
  return `${phone.slice(0, 4)}${'*'.repeat(phone.length - 8)}${phone.slice(-4)}`;
}

/** Short reference code shown to users, e.g. "REF-3F9A1C2B". */
export function shortReference(referenceId) {
  return `REF-${referenceId.replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

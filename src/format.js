const numberFormatter = new Intl.NumberFormat("fa-IR");

export function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

export function formatPrice(value) {
  return `${formatNumber(value)} تومان`;
}

export function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${formatNumber(minutes)}:${String(remainder).padStart(2, "0").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit])}`;
}

export function formatDate(timestamp) {
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
}

export function normalizeDigits(value) {
  return String(value ?? "").replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

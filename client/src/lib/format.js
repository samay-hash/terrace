const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatPrice(value) {
  return inr.format(value ?? 0);
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function formatDate(value) {
  return value ? dateFormat.format(new Date(value)) : "";
}

export function formatDateTime(value) {
  return value ? dateTimeFormat.format(new Date(value)) : "";
}

export function discountPercent(price, compareAtPrice) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const ORDER_STATUS_LABEL = {
  placed: "Placed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_TONE = {
  placed: "neutral",
  packed: "warn",
  shipped: "new",
  delivered: "ok",
  cancelled: "danger",
};

export const KIT_TYPE_LABEL = {
  home: "Home",
  away: "Away",
  third: "Third",
  retro: "Retro",
  training: "Training",
  special: "Special",
};

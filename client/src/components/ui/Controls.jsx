import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { discountPercent, formatPrice } from "../../lib/format.js";
import styles from "./Controls.module.css";

export function QuantityStepper({ value, min = 1, max = 10, onChange, disabled, size = "md", label = "Quantity" }) {
  return (
    <div className={styles.stepper} data-size={size} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <Minus size={16} />
      </button>
      <output className="tabular" aria-live="polite">
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus size={16} />
      </button>
    </div>
  );
}

export function Price({ price, compareAtPrice, size = "md", showSaving = false }) {
  const off = discountPercent(price, compareAtPrice);
  return (
    <span className={styles.price} data-size={size}>
      <span className={`${styles.now} tabular`} data-sale={off ? "" : undefined}>
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <s className={`${styles.was} tabular`}>
            <span className="visually-hidden">Was </span>
            {formatPrice(compareAtPrice)}
          </s>
          {showSaving && <span className={styles.saving}>{off}% off</span>}
        </>
      )}
    </span>
  );
}

export function Badge({ tone = "neutral", children }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}

// Compact numbered pagination: first, last, current ±1, with gaps.
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft size={18} />
      </button>
      {list.map((p, i) => (
        <span key={p} className={styles.pageGroup}>
          {i > 0 && p - list[i - 1] > 1 && <span className={styles.gap} aria-hidden>…</span>}
          <button type="button" onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined} aria-label={`Page ${p}`}>
            {p}
          </button>
        </span>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

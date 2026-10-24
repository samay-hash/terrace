import { Truck } from "lucide-react";
import { formatPrice } from "../../lib/format.js";
import styles from "./Cart.module.css";

export function FreeShippingMeter({ summary }) {
  const { subtotal, freeShippingThreshold, amountToFreeShipping } = summary;
  const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const done = amountToFreeShipping === 0 && subtotal > 0;

  return (
    <div className={styles.meter}>
      <p>
        <Truck size={16} aria-hidden />
        {done ? (
          <span>Your order ships free.</span>
        ) : (
          <span>
            Add <strong className="tabular">{formatPrice(amountToFreeShipping)}</strong> more for free shipping.
          </span>
        )}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Progress to free shipping"
      >
        <span style={{ width: `${progress}%` }} data-done={done ? "" : undefined} />
      </div>
    </div>
  );
}

export function SummaryRows({ summary }) {
  return (
    <dl className={styles.rows}>
      <div>
        <dt>Subtotal</dt>
        <dd className="tabular">{formatPrice(summary.subtotal)}</dd>
      </div>
      <div>
        <dt>Shipping</dt>
        <dd className="tabular">{summary.shippingFee === 0 ? "Free" : formatPrice(summary.shippingFee)}</dd>
      </div>
      <div className={styles.totalRow}>
        <dt>Total</dt>
        <dd className="tabular">{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

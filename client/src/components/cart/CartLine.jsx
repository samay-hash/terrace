import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { assetUrl } from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import { QuantityStepper } from "../ui/Controls.jsx";
import styles from "./Cart.module.css";

const ISSUE_TEXT = {
  unavailable: "No longer available. Remove it to continue.",
  size: "This size is no longer made. Remove it to continue.",
  out_of_stock: "Sold out in this size. Remove it to continue.",
};

export function CartLine({ item, compact = false, onNavigate }) {
  const { updateQuantity, removeItem } = useCart();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  const blocked = item.issue && item.issue !== "limited";
  const name = item.name ?? "Unavailable item";

  return (
    <li className={styles.line} data-compact={compact ? "" : undefined} data-blocked={blocked ? "" : undefined} aria-busy={busy || undefined}>
      <Link to={item.slug ? `/product/${item.slug}` : "#"} className={styles.thumb} onClick={onNavigate} tabIndex={-1} aria-hidden>
        {item.image && <img src={assetUrl(item.image)} alt="" width="120" height="150" />}
      </Link>
      <div className={styles.lineBody}>
        <div className={styles.lineTop}>
          <div>
            {item.slug ? (
              <Link to={`/product/${item.slug}`} className={styles.lineName} onClick={onNavigate}>
                {name}
              </Link>
            ) : (
              <span className={styles.lineName}>{name}</span>
            )}
            <p className={styles.lineMeta}>
              Size {item.size}
              {!compact && item.quantity > 1 && `, ${formatPrice(item.unitPrice)} each`}
            </p>
          </div>
          <span className={`${styles.linePrice} tabular`}>{formatPrice(item.lineTotal)}</span>
        </div>

        {item.issue === "limited" && (
          <p className={styles.issue} data-tone="warn">
            Only {item.available} left, so we've reduced the quantity.
          </p>
        )}
        {blocked && <p className={styles.issue}>{ISSUE_TEXT[item.issue]}</p>}

        <div className={styles.lineActions}>
          {!blocked && (
            <QuantityStepper
              size="sm"
              value={item.quantity}
              max={Math.min(10, item.available)}
              disabled={busy}
              onChange={(quantity) => run(() => updateQuantity(item, quantity))}
              label={`Quantity for ${name}`}
            />
          )}
          <button type="button" className={styles.remove} onClick={() => run(() => removeItem(item))} disabled={busy}>
            <Trash2 size={15} aria-hidden /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

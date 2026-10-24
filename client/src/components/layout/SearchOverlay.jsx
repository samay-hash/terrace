import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowUpRight } from "lucide-react";
import { useProducts } from "../../hooks/queries.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { assetUrl } from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import styles from "./SearchOverlay.module.css";

const POPULAR = ["Rolex", "Sneakers", "Aviator", "Backpack", "Cricket bat", "Heels"];

// Full-width search panel: live results as you type, popular searches when
// empty, Enter for the full results page. Escape or the backdrop closes it.
export function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [value, setValue] = useState("");
  const term = useDebounce(value.trim(), 200);
  const { data, isFetching } = useProducts({ q: term, limit: 6, sort: "popular" }, { enabled: open && term.length >= 2 });
  const results = term.length >= 2 ? data?.items ?? [] : [];

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (path) => {
    onClose();
    setValue("");
    navigate(path);
  };

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Search">
        <div className="container">
          <form
            role="search"
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (value.trim()) go(`/shop?q=${encodeURIComponent(value.trim())}`);
            }}
          >
            <Search size={22} aria-hidden className={styles.icon} />
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search products, brands and categories"
              aria-label="Search products"
              maxLength={80}
              className={styles.input}
            />
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close search">
              <X size={22} />
            </button>
          </form>

          {term.length < 2 ? (
            <div className={styles.popular}>
              <p className={styles.label}>Popular right now</p>
              <div className={styles.chips}>
                {POPULAR.map((q) => (
                  <button key={q} type="button" onClick={() => go(`/shop?q=${encodeURIComponent(q)}`)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.results} aria-live="polite">
              <div className={styles.resultsHead}>
                <p className={styles.label}>{isFetching && !results.length ? "Searching…" : results.length ? "Products" : `Nothing found for “${term}”`}</p>
                {results.length > 0 && (
                  <button type="button" className={styles.all} onClick={() => go(`/shop?q=${encodeURIComponent(term)}`)}>
                    See all results <ArrowUpRight size={15} aria-hidden />
                  </button>
                )}
              </div>
              <ul className={styles.grid}>
                {results.map((p) => (
                  <li key={p.id}>
                    <button type="button" className={styles.item} onClick={() => go(`/product/${p.slug}`)}>
                      <span className={styles.thumb}>
                        <img className="product-photo" src={assetUrl(p.images[0]?.url)} alt="" width="160" height="200" />
                      </span>
                      <span className={styles.itemBrand}>{p.brand}</span>
                      <span className={styles.itemName}>{p.name}</span>
                      <span className="tabular">{formatPrice(p.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useProducts } from "../../hooks/queries.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { assetUrl } from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import styles from "./SearchBox.module.css";

// Product search with live suggestions. Enter (or "See all results") goes
// to the shop page; arrow keys move through suggestions.
export function SearchBox({ autoFocus = false, onNavigate, className = "" }) {
  const navigate = useNavigate();
  const listId = useId();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const term = useDebounce(value.trim(), 220);

  const { data, isFetching } = useProducts({ q: term, limit: 5, sort: "popular" }, { enabled: term.length >= 2 });
  const results = term.length >= 2 ? data?.items ?? [] : [];
  const showList = open && term.length >= 2;

  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => setActive(-1), [term]);

  function go(path) {
    setOpen(false);
    setValue("");
    onNavigate?.();
    navigate(path);
  }

  function submit(event) {
    event.preventDefault();
    if (active >= 0 && results[active]) return go(`/product/${results[active].slug}`);
    if (value.trim()) go(`/shop?q=${encodeURIComponent(value.trim())}`);
  }

  function onKeyDown(event) {
    if (!showList) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className}`}>
      <form role="search" onSubmit={submit} className={styles.form}>
        <Search size={18} className={styles.icon} aria-hidden />
        <input
          type="search"
          className={styles.input}
          placeholder="Search shirts, teams, years"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          aria-label="Search products"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          maxLength={80}
        />
        {value && (
          <button type="button" className={styles.clear} onClick={() => setValue("")} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </form>

      {showList && (
        <div className={styles.panel}>
          <ul id={listId} role="listbox" aria-label="Suggestions">
            {results.map((product, index) => (
              <li
                key={product.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={styles.option}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(`/product/${product.slug}`);
                }}
              >
                <img src={assetUrl(product.images[0]?.url)} alt="" width="44" height="55" />
                <span className={styles.optionText}>
                  <span className={styles.optionName}>{product.name}</span>
                  <span className={styles.optionMeta}>{product.team}</span>
                </span>
                <span className={`${styles.optionPrice} tabular`}>{formatPrice(product.price)}</span>
              </li>
            ))}
          </ul>
          {!results.length && !isFetching && <p className={styles.none}>No shirts match “{term}”. Try a team, colour or year.</p>}
          {results.length > 0 && (
            <button
              type="button"
              className={styles.all}
              onMouseDown={(e) => {
                e.preventDefault();
                go(`/shop?q=${encodeURIComponent(term)}`);
              }}
            >
              See all results for “{term}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}

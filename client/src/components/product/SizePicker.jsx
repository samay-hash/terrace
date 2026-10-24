import styles from "./SizePicker.module.css";

// Radio group of sizes in the order the product lists them. Sold-out sizes
// stay visible (crossed out) so the shopper can see the full run.
export function SizePicker({ sizes, value, onChange, error, onGuide }) {
  const selected = sizes.find((s) => s.label === value);

  return (
    <fieldset className={styles.fieldset} aria-describedby={error ? "size-error" : undefined}>
      <legend className={styles.legend}>
        <span>
          Size{selected && <span className={styles.chosen}>: {selected.label}</span>}
        </span>
        {onGuide && (
          <button type="button" className={styles.guide} onClick={onGuide}>
            Size guide
          </button>
        )}
      </legend>
      <div className={styles.options} data-count={sizes.length}>
        {sizes.map((size) => {
          const out = size.stock === 0;
          return (
            <label key={size.label} className={styles.option} data-out={out ? "" : undefined}>
              <input type="radio" name="size" value={size.label} checked={value === size.label} disabled={out} onChange={() => onChange(size.label)} />
              <span>{size.label}</span>
              {out && <span className="visually-hidden">, sold out</span>}
            </label>
          );
        })}
      </div>
      {selected && selected.stock <= 5 && <p className={styles.hint}>Only {selected.stock} left in {selected.label}</p>}
      {error && (
        <p id="size-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

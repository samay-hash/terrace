import styles from "./SizePicker.module.css";

const ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

// Radio group of sizes. Sold-out sizes stay visible (crossed out) so the
// shopper can see the full run, but cannot be selected.
export function SizePicker({ sizes, value, onChange, error }) {
  const sorted = [...sizes].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label));
  const selected = sorted.find((s) => s.label === value);

  return (
    <fieldset className={styles.fieldset} aria-describedby={error ? "size-error" : undefined}>
      <legend className={styles.legend}>
        <span>Size</span>
        {selected && selected.stock <= 5 && <span className={styles.hint}>Only {selected.stock} left in {selected.label}</span>}
      </legend>
      <div className={styles.options} role="radiogroup">
        {sorted.map((size) => {
          const out = size.stock === 0;
          return (
            <label key={size.label} className={styles.option} data-out={out ? "" : undefined}>
              <input
                type="radio"
                name="size"
                value={size.label}
                checked={value === size.label}
                disabled={out}
                onChange={() => onChange(size.label)}
              />
              <span>{size.label}</span>
              {out && <span className="visually-hidden">, sold out</span>}
            </label>
          );
        })}
      </div>
      {error && (
        <p id="size-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

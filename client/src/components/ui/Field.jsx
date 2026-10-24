import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import styles from "./Field.module.css";

// Label + control + hint/error, wired up with aria attributes so screen
// readers announce the error with the field.
export function Field({ label, hint, error, children, optional, className = "" }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`${styles.field} ${className}`} data-invalid={error ? "" : undefined}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {optional && <span className={styles.optional}>Optional</span>}
        </label>
      )}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef(function TextInput({ label, hint, error, optional, className, prefix, ...rest }, ref) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {(aria) =>
        prefix ? (
          <div className={styles.affix}>
            <span className={styles.prefix}>{prefix}</span>
            <input ref={ref} className={styles.control} {...aria} {...rest} />
          </div>
        ) : (
          <input ref={ref} className={styles.control} {...aria} {...rest} />
        )
      }
    </Field>
  );
});

export const PasswordInput = forwardRef(function PasswordInput({ label, hint, error, className, ...rest }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(aria) => (
        <div className={styles.affix}>
          <input ref={ref} className={styles.control} type={visible ? "text" : "password"} {...aria} {...rest} />
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      )}
    </Field>
  );
});

export const TextArea = forwardRef(function TextArea({ label, hint, error, optional, className, ...rest }, ref) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {(aria) => <textarea ref={ref} className={`${styles.control} ${styles.textarea}`} {...aria} {...rest} />}
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, hint, error, className, children, ...rest }, ref) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(aria) => (
        <div className={styles.selectWrap}>
          <select ref={ref} className={`${styles.control} ${styles.select}`} {...aria} {...rest}>
            {children}
          </select>
          <ChevronDown size={16} className={styles.chevron} aria-hidden />
        </div>
      )}
    </Field>
  );
});

export function Checkbox({ label, description, className = "", ...rest }) {
  return (
    <label className={`${styles.check} ${className}`}>
      <input type="checkbox" {...rest} />
      <span className={styles.box} aria-hidden />
      <span>
        <span className={styles.checkLabel}>{label}</span>
        {description && <span className={styles.checkDescription}>{description}</span>}
      </span>
    </label>
  );
}

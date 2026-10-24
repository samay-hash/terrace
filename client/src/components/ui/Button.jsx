import { forwardRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.css";

// One button for every action. `variant` sets emphasis, `size` sets density.
// Pass `to` for a router link or `href` for an external link.
export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", block = false, loading = false, to, href, className = "", children, disabled, ...rest },
  ref,
) {
  const classes = [styles.button, styles[variant], styles[size], block ? styles.block : "", className].join(" ");
  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden />}
      <span className={styles.label}>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});

export function IconButton({ label, className = "", children, ...rest }) {
  return (
    <button type="button" className={`${styles.icon} ${className}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

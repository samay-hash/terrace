import { Link } from "react-router-dom";
import styles from "./Logo.module.css";

// The mark is a set of terrace steps seen side-on.
export function TerraceMark({ size = 22, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M0 24V17h7v-7h7V3h10v21Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ to = "/", tone = "ink", label = "Terrace home" }) {
  return (
    <Link to={to} className={styles.logo} data-tone={tone} aria-label={label}>
      <TerraceMark className={styles.mark} />
      <span className={styles.word}>Terrace</span>
    </Link>
  );
}

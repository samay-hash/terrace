import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button.jsx";
import styles from "./Feedback.module.css";

export function Spinner({ label = "Loading", size = 28 }) {
  return (
    <span className={styles.spinnerWrap} role="status">
      <span className={styles.spinner} style={{ width: size, height: size }} aria-hidden />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

export function PageLoader({ label = "Loading" }) {
  return (
    <div className={styles.pageLoader}>
      <Spinner label={label} />
    </div>
  );
}

export function Skeleton({ width, height = 16, radius, className = "" }) {
  return <span className={`${styles.skeleton} ${className}`} style={{ width, height, borderRadius: radius }} aria-hidden />;
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <h2 className={styles.emptyTitle}>{title}</h2>
      {children && <p className={styles.emptyText}>{children}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "This didn't load" }) {
  return (
    <div className={styles.empty} role="alert">
      <div className={`${styles.emptyIcon} ${styles.errorIcon}`}>
        <AlertTriangle size={22} />
      </div>
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className={styles.emptyText}>{error?.message ?? "Something went wrong. Please try again."}</p>
      {onRetry && (
        <div className={styles.emptyAction}>
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw size={16} aria-hidden /> Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export function Notice({ tone = "info", children }) {
  return (
    <div className={styles.notice} data-tone={tone} role={tone === "error" ? "alert" : undefined}>
      {children}
    </div>
  );
}

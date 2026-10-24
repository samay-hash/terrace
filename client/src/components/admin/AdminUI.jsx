import { Modal } from "../ui/Overlay.jsx";
import { Button } from "../ui/Button.jsx";
import styles from "./AdminUI.module.css";
import layout from "./Admin.module.css";

export function AdminHeader({ title, description, actions }) {
  return (
    <header className={layout.pageHeader}>
      <div>
        <h1 className={layout.pageTitle}>{title}</h1>
        {description && <p className={layout.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={layout.pageActions}>{actions}</div>}
    </header>
  );
}

export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`${styles.panel} ${className}`}>
      {(title || action) && (
        <div className={styles.panelHead}>
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value, note, tone }) {
  return (
    <div className={styles.stat} data-tone={tone}>
      <p className={styles.statLabel}>{label}</p>
      <p className={`${styles.statValue} tabular`}>{value}</p>
      {note && <p className={styles.statNote}>{note}</p>}
    </div>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel, tone = "danger", busy, onConfirm, onClose, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export function TableWrap({ children }) {
  return <div className={styles.tableWrap}>{children}</div>;
}

export { styles as adminStyles };

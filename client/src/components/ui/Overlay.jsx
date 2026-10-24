import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./Overlay.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared behaviour for modal surfaces: Escape closes, focus moves inside and
// is trapped there, the page behind stops scrolling, and focus returns to
// whatever opened the surface when it closes.
function useModalBehaviour(open, onClose, panelRef) {
  // Keep the latest onClose without re-running the effect (which would
  // steal focus back to the first field on every parent render).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector("[data-autofocus]") ?? panel?.querySelector(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, panelRef]);
}

export function Modal({ open, onClose, title, description, children, footer, size = "sm" }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useModalBehaviour(open, onClose, panelRef);
  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className={styles.modal} data-size={size} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className={styles.modalHeader}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {description && <p className={styles.description}>{description}</p>}
        {children && <div className={styles.modalBody}>{children}</div>}
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, footer, side = "right", label }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useModalBehaviour(open, onClose, panelRef);
  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop} data-variant="drawer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside
        ref={panelRef}
        className={styles.drawer}
        data-side={side}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        tabIndex={-1}
      >
        {title && (
          <div className={styles.drawerHeader}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        )}
        <div className={styles.drawerBody}>{children}</div>
        {footer && <div className={styles.drawerFooter}>{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

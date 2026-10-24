import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import styles from "./Toast.module.css";

const ToastContext = createContext(null);
const DURATION_MS = 4200;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, { tone = "success", action } = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, tone, action }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({ success: (m, o) => show(m, { ...o, tone: "success" }), error: (m, o) => show(m, { ...o, tone: "error" }) }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast} data-tone={toast.tone}>
            {toast.tone === "error" ? <AlertCircle size={18} aria-hidden /> : <CheckCircle2 size={18} aria-hidden />}
            <span className={styles.message}>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" className={styles.close} onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

import { Logo } from "../layout/Logo.jsx";
import { Chotu } from "../chat/Chotu.jsx";
import { RotateCcw, Banknote, MessageCircle } from "lucide-react";
import styles from "./AuthLayout.module.css";

export function AuthLayout({ heading, subheading, quote, children }) {
  return (
    <div className={styles.page}>
      <aside className={styles.panel}>
        <img className={styles.photo} src="/images/pitch-night.webp" alt="" width="1024" height="731" />
        <div className={styles.panelInner}>
          <Logo tone="light" />
          <h2 className={`display ${styles.heading}`}>{heading}</h2>
          <p className={styles.sub}>{subheading}</p>

          <div className={styles.mascot}>
            <Chotu size={120} mood="idle" />
            <p className={styles.bubble}>
              <span>Chotu</span>
              {quote}
            </p>
          </div>

          <ul className={styles.perks}>
            <li>
              <RotateCcw size={15} aria-hidden /> 30-day free returns
            </li>
            <li>
              <Banknote size={15} aria-hidden /> Cash on delivery
            </li>
            <li>
              <MessageCircle size={15} aria-hidden /> Order updates by SMS
            </li>
          </ul>
        </div>
      </aside>
      <main className={styles.formSide}>
        <div className={styles.mobileLogo}>
          <Logo />
        </div>
        <div className={styles.form}>{children}</div>
      </main>
    </div>
  );
}

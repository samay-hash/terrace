import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Lock, PackageCheck, RotateCcw, Zap } from "lucide-react";
import { Logo } from "../layout/Logo.jsx";
import styles from "./AuthLayout.module.css";

const BENEFITS = [
  { icon: Zap, title: "Faster checkout", text: "Your bag and address, saved" },
  { icon: PackageCheck, title: "Order tracking", text: "Every step to your door" },
  { icon: RotateCcw, title: "Easy returns", text: "Started from your orders" },
];

export function AuthLayout({ heading, subheading, children }) {
  const { pathname, search } = useLocation();

  return (
    <div className={styles.page}>
      <aside className={styles.panel}>
        <img
          className={styles.photo}
          src="/images/editorial/study-1672.webp"
          srcSet="/images/editorial/study-960.webp 960w, /images/editorial/study-1672.webp 1672w"
          sizes="50vw"
          alt=""
        />
        <div className={styles.panelInner}>
          <Logo tone="light" />
          <div className={styles.panelCopy}>
            <p className={styles.kicker}>Terrace account</p>
            <h2 className={`display ${styles.heading}`}>{heading}</h2>
            <p className={styles.sub}>{subheading}</p>
            <ul className={styles.benefits}>
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <Icon size={18} strokeWidth={1.6} aria-hidden />
                  <strong>{title}</strong>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.top}>
          <div className={styles.mobileLogo}>
            <Logo />
          </div>
          <Link to="/" className={styles.back}>
            <ArrowLeft size={16} aria-hidden /> Back to the store
          </Link>
        </div>

        <div className={styles.form}>
          <nav className={styles.tabs} aria-label="Account">
            <Link to={`/login${search}`} aria-current={pathname === "/login" ? "page" : undefined}>
              Sign in
            </Link>
            <Link to={`/signup${search}`} aria-current={pathname === "/signup" ? "page" : undefined}>
              Create account
            </Link>
          </nav>
          {children}
        </div>

        <p className={styles.secure}>
          <Lock size={14} aria-hidden /> Your session is encrypted and kept in a secure cookie.
        </p>
      </main>
    </div>
  );
}

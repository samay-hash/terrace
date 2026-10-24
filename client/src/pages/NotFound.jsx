import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { Button } from "../components/ui/Button.jsx";
import { Chotu } from "../components/chat/Chotu.jsx";
import styles from "./NotFound.module.css";

export default function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <div className={`container ${styles.page}`}>
      <p className={`display ${styles.code}`} aria-hidden>
        404
      </p>
      <Chotu size={96} />
      <h1 className={styles.title}>Offside. This page doesn't exist.</h1>
      <p className={styles.text}>The link may be old or mistyped. Chotu checked twice and is not happy about it.</p>
      <div className={styles.actions}>
        <Button to="/" variant="dark">
          Back to the home page
        </Button>
        <Button to="/shop" variant="secondary">
          Browse the shop
        </Button>
      </div>
    </div>
  );
}

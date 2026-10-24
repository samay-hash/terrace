import { ShoppingBag, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { pluralize } from "../lib/format.js";
import { CartLine } from "../components/cart/CartLine.jsx";
import { FreeShippingMeter, SummaryRows } from "../components/cart/CartSummary.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, Notice, PageLoader } from "../components/ui/Feedback.jsx";
import styles from "./CartPage.module.css";

export default function CartPage() {
  useDocumentTitle("Your bag");
  const { cart, isLoading } = useCart();
  const { user } = useAuth();

  if (isLoading) return <PageLoader label="Loading your bag" />;

  if (!cart.items.length) {
    return (
      <div className="container">
        <EmptyState
          icon={<ShoppingBag size={24} />}
          title="Your bag is empty"
          action={
            <Button to="/shop" variant="dark">
              Start shopping
            </Button>
          }
        >
          Find something you like and it will wait here.
        </EmptyState>
      </div>
    );
  }

  const blocked = cart.items.some((i) => i.issue && i.issue !== "limited");

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={`display ${styles.title}`}>Your bag</h1>
      <p className={styles.count}>{pluralize(cart.summary.itemCount, "item")}</p>

      <div className={styles.layout}>
        <section aria-label="Items in your bag">
          <ul className={styles.lines}>
            {cart.items.map((item) => (
              <CartLine key={item.id ?? `${item.productId}:${item.size}`} item={item} />
            ))}
          </ul>
        </section>

        <aside className={styles.summary} aria-label="Order summary">
          <h2 className={styles.summaryTitle}>Summary</h2>
          <FreeShippingMeter summary={cart.summary} />
          <SummaryRows summary={cart.summary} />
          {blocked && <Notice tone="error">Remove unavailable items to continue to checkout.</Notice>}
          <Button to={blocked ? undefined : "/checkout"} size="lg" block disabled={blocked} aria-disabled={blocked || undefined}>
            {user ? "Checkout" : "Sign in and checkout"}
          </Button>
          <p className={styles.secure}>
            <ShieldCheck size={16} aria-hidden /> Prices and stock are confirmed again when you place the order.
          </p>
        </aside>
      </div>
    </div>
  );
}
